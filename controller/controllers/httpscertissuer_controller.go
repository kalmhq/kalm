/*

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package controllers

import (
	"bytes"
	"context"
	"crypto/ecdsa"
	"crypto/ed25519"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"fmt"
	"github.com/go-logr/logr"
	"github.com/jetstack/cert-manager/pkg/apis/acme/v1alpha2"
	cmmetav1 "github.com/jetstack/cert-manager/pkg/apis/meta/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"log"
	"math/big"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"time"

	cmv1alpha2 "github.com/jetstack/cert-manager/pkg/apis/certmanager/v1alpha2"
	corev1alpha1 "github.com/kapp-staging/kapp/controller/api/v1alpha1"
)

// HttpsCertIssuerReconciler reconciles a HttpsCertIssuer object
type HttpsCertIssuerReconciler struct {
	client.Client
	Log    logr.Logger
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=core.kapp.dev,resources=httpscertissuers,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=httpscertissuers/status,verbs=get;update;patch

func (r *HttpsCertIssuerReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()
	log := r.Log.WithValues("httpscertissuer", req.NamespacedName)

	// your logic here
	var httpsCertIssuer corev1alpha1.HttpsCertIssuer
	if err := r.Get(ctx, req.NamespacedName, &httpsCertIssuer); err != nil {
		err = client.IgnoreNotFound(err)
		if err != nil {
			log.Error(err, "fail to get HttpsCertIssuer")
		}

		return ctrl.Result{}, err
	}

	if httpsCertIssuer.Spec.CAForTest != nil {
		return r.ReconcileCAForTest(ctx, httpsCertIssuer)
	}

	if httpsCertIssuer.Spec.ACMECloudFlare != nil {
		return r.ReconcileACMECloudFlare(ctx, httpsCertIssuer)
	}

	return ctrl.Result{}, nil
}

func (r *HttpsCertIssuerReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.HttpsCertIssuer{}).
		Complete(r)
}

func (r *HttpsCertIssuerReconciler) ReconcileCAForTest(ctx context.Context, issuer corev1alpha1.HttpsCertIssuer) (ctrl.Result, error) {
	caSecretName := issuer.Name

	// auto generate tls secret for our CA
	sec := corev1.Secret{}
	if err := r.Get(ctx, types.NamespacedName{
		Namespace: "cert-manager",
		Name:      caSecretName,
	}, &sec); err != nil {
		if !errors.IsNotFound(err) {
			return ctrl.Result{}, err
		}

		key, crt, err := r.generateRandomPrvKeyAndCrtForCA()
		if err != nil {
			return ctrl.Result{}, err
		}

		sec := corev1.Secret{
			ObjectMeta: v1.ObjectMeta{
				Namespace: "cert-manager",
				Name:      caSecretName,
			},
			StringData: map[string]string{
				"tls.key": string(key),
				"tls.crt": string(crt),
			},
			Type: "kubernetes.io/tls",
		}

		if err := ctrl.SetControllerReference(&issuer, &sec, r.Scheme); err != nil {
			return ctrl.Result{}, err
		}

		if err := r.Create(ctx, &sec); err != nil {
			return ctrl.Result{}, err
		}

		r.Log.Info("secret created")
	}

	// start our CA using secret
	clusterIssuer := cmv1alpha2.ClusterIssuer{}
	err := r.Get(ctx, types.NamespacedName{Name: issuer.Name}, &clusterIssuer)
	if err != nil {
		if errors.IsNotFound(err) {

			clusterIssuer := cmv1alpha2.ClusterIssuer{
				ObjectMeta: v1.ObjectMeta{
					Name: issuer.Name,
				},
				Spec: cmv1alpha2.IssuerSpec{
					IssuerConfig: cmv1alpha2.IssuerConfig{
						CA: &cmv1alpha2.CAIssuer{
							SecretName: caSecretName,
						},
					},
				},
			}

			if err := ctrl.SetControllerReference(&issuer, &clusterIssuer, r.Scheme); err != nil {
				return ctrl.Result{}, err
			}

			r.Log.Info("creating clusterIssuer")
			if err := r.Create(ctx, &clusterIssuer); err != nil {
				r.Log.Error(err, "fail create clusterIssuer")
				return ctrl.Result{}, err
			}
		} else {
			return ctrl.Result{}, err
		}
	}

	return ctrl.Result{}, nil
}

// config ACME cloudflare
func (r *HttpsCertIssuerReconciler) ReconcileACMECloudFlare(ctx context.Context, issuer corev1alpha1.HttpsCertIssuer) (ctrl.Result, error) {

	acmeSpec := issuer.Spec.ACMECloudFlare
	email := acmeSpec.Email
	plainSecret := acmeSpec.APIKey

	secName := issuer.Name
	secKey := "sec-content"

	sec := corev1.Secret{}
	if err := r.Get(ctx, types.NamespacedName{Namespace: "cert-manager", Name: secName}, &sec); err != nil {
		if !errors.IsNotFound(err) {
			return ctrl.Result{}, err
		}

		sec := corev1.Secret{
			ObjectMeta: v1.ObjectMeta{
				Namespace: "cert-manager",
				Name:      secName,
			},
			StringData: map[string]string{
				secKey: plainSecret,
			},
			Type: "Opaque",
		}

		if err := ctrl.SetControllerReference(&issuer, &sec, r.Scheme); err != nil {
			return ctrl.Result{}, err
		}

		if err := r.Create(ctx, &sec); err != nil {
			return ctrl.Result{}, err
		}

		r.Log.Info("secret created")
	}

	// ref: https://cert-manager.io/docs/configuration/acme/dns01/cloudflare/
	expectedClusterIssuer := cmv1alpha2.ClusterIssuer{
		ObjectMeta: v1.ObjectMeta{
			Name: issuer.Name,
		},
		Spec: cmv1alpha2.IssuerSpec{
			IssuerConfig: cmv1alpha2.IssuerConfig{
				ACME: &v1alpha2.ACMEIssuer{
					Email:  email,
					Server: "https://acme-staging-v02.api.letsencrypt.org/directory",
					//Server: "https://acme-v02.api.letsencrypt.org/directory",
					PrivateKey: cmmetav1.SecretKeySelector{ // what is this prvKey used for?
						LocalObjectReference: cmmetav1.LocalObjectReference{
							Name: getPrvKeyNameForClusterIssuer(issuer),
						},
					},
					Solvers: []v1alpha2.ACMEChallengeSolver{
						{
							DNS01: &v1alpha2.ACMEChallengeSolverDNS01{
								Cloudflare: &v1alpha2.ACMEIssuerDNS01ProviderCloudflare{
									Email: email,
									APIKey: &cmmetav1.SecretKeySelector{
										LocalObjectReference: cmmetav1.LocalObjectReference{
											Name: secName,
										},
										Key: secKey,
									},
								},
							},
						},
					},
				},
			},
		},
	}

	clusterIssuer := cmv1alpha2.ClusterIssuer{}
	var isNew bool
	if err := r.Get(ctx, client.ObjectKey{Name: issuer.Name}, &clusterIssuer); err != nil {
		if !errors.IsNotFound(err) {
			return ctrl.Result{}, err
		}

		clusterIssuer = expectedClusterIssuer
		isNew = true
	}

	if isNew {
		if err := ctrl.SetControllerReference(&issuer, &clusterIssuer, r.Scheme); err != nil {
			return ctrl.Result{}, err
		}

		r.Log.Info("creating clusterIssuer")
		if err := r.Create(ctx, &clusterIssuer); err != nil {
			r.Log.Error(err, "fail create clusterIssuer")
			return ctrl.Result{}, err
		}
	} else {
		clusterIssuer.Spec = expectedClusterIssuer.Spec

		if err := r.Update(ctx, &clusterIssuer); err != nil {
			r.Log.Error(err, "fail update clusterIssuer")
			return ctrl.Result{}, err
		}
	}

	//todo
	//conditions := clusterIssuer.Status.Conditions
	//latestCondition := conditions[len(conditions) - 1]
	//latestCondition.Type
	//if issuer.Status.OK !=

	return ctrl.Result{}, nil
}

func getPrvKeyNameForClusterIssuer(issuer corev1alpha1.HttpsCertIssuer) string {
	return fmt.Sprintf("prvkey-%s", issuer.Name)
}

func (r *HttpsCertIssuerReconciler) generateRandomPrvKeyAndCrtForCA() (prvKey []byte, crt []byte, err error) {
	priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		log.Fatalf("Failed to generate private key: %v", err)
		return nil, nil, err
	}

	serialNumberLimit := new(big.Int).Lsh(big.NewInt(1), 128)
	serialNumber, err := rand.Int(rand.Reader, serialNumberLimit)
	if err != nil {
		log.Fatalf("Failed to generate serial number: %v", err)
		return nil, nil, err
	}

	template := x509.Certificate{
		IsCA:         true,
		SerialNumber: serialNumber,
		Subject: pkix.Name{
			Organization: []string{"Kapp CA for Test Co"},
		},
		KeyUsage:              x509.KeyUsageCertSign | x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
		NotBefore:             time.Now(),
		NotAfter:              time.Unix(time.Now().Unix()+60*60*24, 0),
	}

	derBytes, err := x509.CreateCertificate(rand.Reader, &template, &template, publicKey(priv), priv)
	if err != nil {
		log.Fatalf("Failed to create certificate: %v", err)
		return nil, nil, err
	}

	//certOut, err := os.Create("cert.pem")
	//if err != nil {
	//	log.Fatalf("Failed to open cert.pem for writing: %v", err)
	//}

	var certOutBuf bytes.Buffer
	if err := pem.Encode(&certOutBuf, &pem.Block{Type: "CERTIFICATE", Bytes: derBytes}); err != nil {
		log.Fatalf("Failed to write data to cert.pem: %v", err)
		return nil, nil, err
	}
	//if err := certOut.Close(); err != nil {
	//	log.Fatalf("Error closing cert.pem: %v", err)
	//}
	log.Print("wrote cert.pem\n")

	//keyOut, err := os.OpenFile("key.pem", os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0600)
	//if err != nil {
	//	log.Fatalf("Failed to open key.pem for writing: %v", err)
	//	return
	//}

	var keyOutBuf bytes.Buffer
	privBytes, err := x509.MarshalPKCS8PrivateKey(priv)
	if err != nil {
		log.Fatalf("Unable to marshal private key: %v", err)
		return nil, nil, err
	}
	if err := pem.Encode(&keyOutBuf, &pem.Block{Type: "PRIVATE KEY", Bytes: privBytes}); err != nil {
		log.Fatalf("Failed to write data to key.pem: %v", err)
		return nil, nil, err
	}
	//if err := keyOut.Close(); err != nil {
	//	log.Fatalf("Error closing key.pem: %v", err)
	//}
	log.Print("wrote key.pem\n")

	return keyOutBuf.Bytes(), certOutBuf.Bytes(), nil
}

func publicKey(priv interface{}) interface{} {
	switch k := priv.(type) {
	case *rsa.PrivateKey:
		return &k.PublicKey
	case *ecdsa.PrivateKey:
		return &k.PublicKey
	case ed25519.PrivateKey:
		return k.Public().(ed25519.PublicKey)
	default:
		return nil
	}
}
