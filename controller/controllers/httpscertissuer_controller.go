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
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"math/big"
	"os"
	"time"

	"github.com/jetstack/cert-manager/pkg/apis/acme/v1alpha2"
	cmmetav1 "github.com/jetstack/cert-manager/pkg/apis/meta/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"

	cmv1alpha2 "github.com/jetstack/cert-manager/pkg/apis/certmanager/v1alpha2"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	corev1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
)

// HttpsCertIssuerReconciler reconciles a HttpsCertIssuer object
type HttpsCertIssuerReconciler struct {
	*BaseReconciler
}

// +kubebuilder:rbac:groups=core.kalm.dev,resources=httpscertissuers,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kalm.dev,resources=httpscertissuers/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=cert-manager.io,resources=clusterissuers,verbs=get;list;watch;create;update;patch;delete

func (r *HttpsCertIssuerReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()

	certMgrNs := corev1.Namespace{}
	err := r.Get(ctx, client.ObjectKey{Name: CertManagerNamespace}, &certMgrNs)

	if err != nil {
		if errors.IsNotFound(err) {
			r.Log.Info(fmt.Sprintf("%s not setup, HttpsCertIssuerReconciler skipped", CertManagerNamespace))
			return ctrl.Result{}, nil
		}

		return ctrl.Result{}, err
	}

	var httpsCertIssuer corev1alpha1.HttpsCertIssuer
	if err := r.Get(ctx, req.NamespacedName, &httpsCertIssuer); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	if httpsCertIssuer.Spec.CAForTest != nil {
		return r.ReconcileCAForTest(ctx, httpsCertIssuer)
	}

	if httpsCertIssuer.Spec.ACMECloudFlare != nil {
		return r.ReconcileACMECloudFlare(ctx, httpsCertIssuer)
	}

	if httpsCertIssuer.Spec.HTTP01 != nil {
		return r.ReconcileHTTP01(ctx, httpsCertIssuer)
	}

	if httpsCertIssuer.Spec.DNS01 != nil {
		return r.ReconcileDNS01(ctx, httpsCertIssuer)
	}

	return ctrl.Result{}, nil
}

func NewHttpsCertIssuerReconciler(mgr ctrl.Manager) *HttpsCertIssuerReconciler {
	return &HttpsCertIssuerReconciler{
		BaseReconciler: NewBaseReconciler(mgr, "HttpsCertIssuer"),
	}
}

type CertManagerNSWatcher struct {
	*HttpsCertIssuerReconciler
}

func (c CertManagerNSWatcher) Map(object handler.MapObject) []reconcile.Request {
	if object.Meta.GetName() != CertManagerNamespace {
		return nil
	}

	// creation of cert-manager ns triggers reconciliation
	allCertIssuer := corev1alpha1.HttpsCertIssuerList{}
	err := c.HttpsCertIssuerReconciler.List(context.Background(), &allCertIssuer)
	if err != nil {
		c.Log.Error(err, "fail to list httpsCertIssuers")
		return nil
	}

	var reqs []reconcile.Request
	for _, issuer := range allCertIssuer.Items {
		reqs = append(reqs, reconcile.Request{
			NamespacedName: types.NamespacedName{
				// HttpsCertIssuer is Cluster Scope
				Name: issuer.Name,
			},
		})
	}

	return reqs
}

func (r *HttpsCertIssuerReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.HttpsCertIssuer{}).
		Owns(&cmv1alpha2.Issuer{}).
		Owns(&corev1.Secret{}).
		Watches(genSourceForObject(&corev1.Namespace{}), &handler.EnqueueRequestsFromMapFunc{
			ToRequests: CertManagerNSWatcher{r},
		}).
		Complete(r)
}

const (
	SecretKeyOfTLSCert = "tls.crt"
	SecretKeyOfTLSKey  = "tls.key"
)

func (r *HttpsCertIssuerReconciler) ReconcileCAForTest(ctx context.Context, certIssuer corev1alpha1.HttpsCertIssuer) (ctrl.Result, error) {
	caSecretName := certIssuer.Name

	// auto generate tls secret for our CA
	sec := corev1.Secret{}
	if err := r.Get(ctx, types.NamespacedName{
		Namespace: CertManagerNamespace,
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
				Namespace: CertManagerNamespace,
				Name:      caSecretName,
			},
			StringData: map[string]string{
				SecretKeyOfTLSKey:  string(key),
				SecretKeyOfTLSCert: string(crt),
			},
			Type: "kubernetes.io/tls",
		}

		if err := ctrl.SetControllerReference(&certIssuer, &sec, r.Scheme); err != nil {
			return ctrl.Result{}, err
		}

		if err := r.Create(ctx, &sec); err != nil {
			return ctrl.Result{}, err
		}

		r.EmitNormalEvent(&certIssuer, "SecretCreated", "secret is created.")
	}

	expectedClusterIssuer := cmv1alpha2.ClusterIssuer{
		ObjectMeta: v1.ObjectMeta{
			Name: certIssuer.Name,
		},
		Spec: cmv1alpha2.IssuerSpec{
			IssuerConfig: cmv1alpha2.IssuerConfig{
				CA: &cmv1alpha2.CAIssuer{
					SecretName: caSecretName,
				},
			},
		},
	}

	// start our CA using secret
	clusterIssuer := cmv1alpha2.ClusterIssuer{}

	err := r.Get(ctx, types.NamespacedName{
		Name: certIssuer.Name,
	}, &clusterIssuer)

	if err != nil {
		if errors.IsNotFound(err) {
			clusterIssuer = expectedClusterIssuer

			if err := ctrl.SetControllerReference(&certIssuer, &expectedClusterIssuer, r.Scheme); err != nil {
				return ctrl.Result{}, err
			}

			if err := r.Create(ctx, &clusterIssuer); err != nil {
				r.EmitWarningEvent(&certIssuer, err, "fail create issuer")
				return ctrl.Result{}, err
			}

			r.EmitNormalEvent(&certIssuer, "IssuerCreated", "Cert manager issuer is created")
		} else {
			clusterIssuer.Spec = expectedClusterIssuer.Spec

			r.Log.Info("updating clusterIssuer")
			if err := r.Update(ctx, &expectedClusterIssuer); err != nil {
				r.EmitWarningEvent(&certIssuer, err, "fail update issuer")
				return ctrl.Result{}, err
			}

			r.EmitNormalEvent(&certIssuer, "IssuerUpdated", "Cert manager issuer is Updated.")
		}
	}

	return ctrl.Result{}, nil
}

const CertManagerNamespace = "cert-manager"

// config ACME cloudflare
func (r *HttpsCertIssuerReconciler) ReconcileACMECloudFlare(ctx context.Context, certIssuer corev1alpha1.HttpsCertIssuer) (ctrl.Result, error) {

	acmeSpec := certIssuer.Spec.ACMECloudFlare
	email := acmeSpec.Email

	apiTokenSecretName := acmeSpec.APITokenSecretName
	// for clusterIssuer, secret has to be in ns: cert-manager to be found by cert-mgr
	apiTokenSecretNamespace := CertManagerNamespace

	issuerName := certIssuer.Name
	//curNs := certIssuer.Namespace

	apiTokenSecret := corev1.Secret{}
	if err := r.Get(ctx, types.NamespacedName{
		Namespace: apiTokenSecretNamespace,
		Name:      apiTokenSecretName,
	}, &apiTokenSecret); err != nil {
		//r.Log.Error(err, fmt.Sprintf("fail to get secret %s", apiTokenSecretName))
		r.EmitWarningEvent(&certIssuer, err, fmt.Sprintf("fail to get secret %s", apiTokenSecretName))

		if certIssuer.Status.OK {
			certIssuer.Status.OK = false
			r.Status().Update(ctx, &certIssuer)
		}
		return ctrl.Result{}, err
	}

	var secKey string
	for k, v := range apiTokenSecret.Data {
		if v == nil {
			continue
		}

		secKey = k
	}

	if secKey == "" {
		err := fmt.Errorf("secret %s has no key", apiTokenSecretName)
		r.EmitWarningEvent(&certIssuer, err, "Secret has no keys.")

		if certIssuer.Status.OK {
			certIssuer.Status.OK = false
			r.Status().Update(ctx, &certIssuer)
		}

		return ctrl.Result{}, err
	}

	// ref: https://cert-manager.io/docs/configuration/acme/dns01/cloudflare/
	expectedClusterIssuer := cmv1alpha2.ClusterIssuer{
		ObjectMeta: v1.ObjectMeta{
			Name: issuerName,
		},
		Spec: cmv1alpha2.IssuerSpec{
			IssuerConfig: cmv1alpha2.IssuerConfig{
				ACME: &v1alpha2.ACMEIssuer{
					Email:  email,
					Server: letsEncryptACMEIssuerServerURL,
					PrivateKey: cmmetav1.SecretKeySelector{
						LocalObjectReference: cmmetav1.LocalObjectReference{
							Name: getPrvKeyNameForIssuer(certIssuer),
						},
					},
					Solvers: []v1alpha2.ACMEChallengeSolver{
						{
							DNS01: &v1alpha2.ACMEChallengeSolverDNS01{
								Cloudflare: &v1alpha2.ACMEIssuerDNS01ProviderCloudflare{
									Email: email,
									APIToken: &cmmetav1.SecretKeySelector{
										LocalObjectReference: cmmetav1.LocalObjectReference{
											Name: apiTokenSecretName,
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
	if err := r.Get(ctx, types.NamespacedName{
		Name: issuerName,
	}, &clusterIssuer); err != nil {
		if !errors.IsNotFound(err) {
			return ctrl.Result{}, err
		}

		clusterIssuer = expectedClusterIssuer
		isNew = true
	}

	if isNew {
		if err := ctrl.SetControllerReference(&certIssuer, &clusterIssuer, r.Scheme); err != nil {
			return ctrl.Result{}, err
		}

		r.Log.Info("creating clusterIssuer")
		if err := r.Create(ctx, &clusterIssuer); err != nil {
			//r.Log.Error(err, "fail create clusterIssuer")
			r.EmitWarningEvent(&certIssuer, err, "fail create issuer")
			return ctrl.Result{}, err
		}

		r.EmitNormalEvent(&certIssuer, "IssuerCreated", "Cert manager issuer is created")
	} else {
		clusterIssuer.Spec = expectedClusterIssuer.Spec

		if err := r.Update(ctx, &clusterIssuer); err != nil {
			r.EmitWarningEvent(&certIssuer, err, "fail update issuer")
			return ctrl.Result{}, err
		}

		r.EmitNormalEvent(&certIssuer, "IssuerUpdated", "Cert manager issuer is Updated.")
	}

	certIssuer.Status.OK = true
	if err := r.Status().Update(ctx, &certIssuer); err != nil {
		return ctrl.Result{}, err
	}

	//todo
	//conditions := clusterIssuer.Status.Conditions
	//latestCondition := conditions[len(conditions) - 1]
	//latestCondition.Type
	//if clusterIssuer.Status.OK !=

	return ctrl.Result{}, nil
}

func getPrvKeyNameForIssuer(issuer corev1alpha1.HttpsCertIssuer) string {
	return fmt.Sprintf("kalm-prvkey-%s", issuer.Name)
}

func (r *HttpsCertIssuerReconciler) generateRandomPrvKeyAndCrtForCA() (prvKey []byte, crt []byte, err error) {
	caPrivKey, err := rsa.GenerateKey(rand.Reader, 4096)
	if err != nil {
		return nil, nil, err
	}

	template := x509.Certificate{
		SerialNumber: big.NewInt(2020),
		Subject: pkix.Name{
			Organization: []string{"Kalm CA for Test Co"},
		},
		NotBefore:             time.Now(),
		NotAfter:              time.Now().AddDate(0, 0, 1),
		IsCA:                  true,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth, x509.ExtKeyUsageServerAuth},
		KeyUsage:              x509.KeyUsageCertSign | x509.KeyUsageDigitalSignature,
		BasicConstraintsValid: true,
	}

	derBytes, err := x509.CreateCertificate(rand.Reader, &template, &template, caPrivKey.Public(), caPrivKey)
	if err != nil {
		r.Log.Error(err, "Failed to create certificate")
		return nil, nil, err
	}

	var certOutBuf bytes.Buffer
	if err := pem.Encode(&certOutBuf, &pem.Block{Type: "CERTIFICATE", Bytes: derBytes}); err != nil {
		r.Log.Error(err, "Failed to write data to cert.pem")
		return nil, nil, err
	}

	var keyOutBuf bytes.Buffer
	privBytes := x509.MarshalPKCS1PrivateKey(caPrivKey)
	if err := pem.Encode(&keyOutBuf, &pem.Block{Type: "RSA PRIVATE KEY", Bytes: privBytes}); err != nil {
		r.Log.Error(err, "Failed to write data to key.pem")
		return nil, nil, err
	}

	return keyOutBuf.Bytes(), certOutBuf.Bytes(), nil
}

// func publicKey(priv interface{}) interface{} {
// 	switch k := priv.(type) {
// 	case *rsa.PrivateKey:
// 		return &k.PublicKey
// 	case *ecdsa.PrivateKey:
// 		return &k.PublicKey
// 	case ed25519.PrivateKey:
// 		return k.Public().(ed25519.PublicKey)
// 	default:
// 		return nil
// 	}
// }

var letsEncryptACMEIssuerServerURL string

func init() {
	customizeIssuerURL := os.Getenv(v1alpha1.ENV_LETSENCRYPT_ACME_ISSUER_SERVER_URL)
	useLetEncryptProductionAPI := os.Getenv(v1alpha1.ENV_USE_LETSENCRYPT_PRODUCTION_API) == "true"

	if customizeIssuerURL != "" {
		letsEncryptACMEIssuerServerURL = customizeIssuerURL
	} else if useLetEncryptProductionAPI {
		letsEncryptACMEIssuerServerURL = "https://acme-v02.api.letsencrypt.org/directory"
	} else {
		// default is using test api from letsencrypt
		letsEncryptACMEIssuerServerURL = "https://acme-staging-v02.api.letsencrypt.org/directory"
	}
}

func (r *HttpsCertIssuerReconciler) ReconcileHTTP01(ctx context.Context, issuer corev1alpha1.HttpsCertIssuer) (ctrl.Result, error) {
	issuerName := issuer.Name
	acmeChallengeSolverHTTP01IngressClass := "istio"

	expectedClusterIssuer := cmv1alpha2.ClusterIssuer{
		ObjectMeta: v1.ObjectMeta{
			Name: issuerName,
		},
		Spec: cmv1alpha2.IssuerSpec{
			IssuerConfig: cmv1alpha2.IssuerConfig{
				ACME: &v1alpha2.ACMEIssuer{
					Email:  issuer.Spec.HTTP01.Email,
					Server: letsEncryptACMEIssuerServerURL,
					PrivateKey: cmmetav1.SecretKeySelector{ // prv key for this acme account
						LocalObjectReference: cmmetav1.LocalObjectReference{
							Name: getPrvKeyNameForIssuer(issuer),
						},
					},
					Solvers: []v1alpha2.ACMEChallengeSolver{
						{
							HTTP01: &v1alpha2.ACMEChallengeSolverHTTP01{
								Ingress: &v1alpha2.ACMEChallengeSolverHTTP01Ingress{
									Class: &acmeChallengeSolverHTTP01IngressClass,
								},
							},
						},
					},
				},
			},
		},
	}

	var clusterIssuer cmv1alpha2.ClusterIssuer
	if err := r.Get(ctx, client.ObjectKey{Name: issuerName}, &clusterIssuer); err != nil {
		if !errors.IsNotFound(err) {
			return ctrl.Result{}, err
		}

		err = r.Create(ctx, &expectedClusterIssuer)
		return ctrl.Result{}, err
	} else {
		clusterIssuer.Spec = expectedClusterIssuer.Spec

		err = r.Update(ctx, &clusterIssuer)
		return ctrl.Result{}, err
	}
}

func (r *HttpsCertIssuerReconciler) ReconcileDNS01(
	ctx context.Context,
	issuer corev1alpha1.HttpsCertIssuer,
) (ctrl.Result, error) {

	expectedClusterIssuer := cmv1alpha2.ClusterIssuer{
		ObjectMeta: v1.ObjectMeta{
			Name: issuer.Name,
		},
		Spec: cmv1alpha2.IssuerSpec{
			IssuerConfig: cmv1alpha2.IssuerConfig{
				ACME: &v1alpha2.ACMEIssuer{
					Server: letsEncryptACMEIssuerServerURL,
					PrivateKey: cmmetav1.SecretKeySelector{ // prv key for this acme account
						LocalObjectReference: cmmetav1.LocalObjectReference{
							Name: getPrvKeyNameForIssuer(issuer),
						},
					},
					Solvers: []v1alpha2.ACMEChallengeSolver{
						{
							DNS01: &v1alpha2.ACMEChallengeSolverDNS01{
								AcmeDNS: &v1alpha2.ACMEIssuerDNS01ProviderAcmeDNS{
									Host: fmt.Sprintf("http://%s", getSVCNameForACMEDNS()),
									AccountSecret: cmmetav1.SecretKeySelector{
										LocalObjectReference: cmmetav1.LocalObjectReference{
											Name: "cert-manager-acme-secret",
										},
										Key: "acmedns.json",
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
	isNew := false

	err := r.Get(ctx, client.ObjectKey{Name: expectedClusterIssuer.Name}, &clusterIssuer)
	if err != nil {
		if errors.IsNotFound(err) {
			isNew = true
		} else {
			return ctrl.Result{}, err
		}
	}

	if isNew {
		clusterIssuer = expectedClusterIssuer

		if err := ctrl.SetControllerReference(&issuer, &clusterIssuer, r.Scheme); err != nil {
			return ctrl.Result{}, err
		}

		err = r.Create(ctx, &clusterIssuer)
	} else {
		clusterIssuer.Spec = expectedClusterIssuer.Spec
		err = r.Update(ctx, &clusterIssuer)
	}

	if err != nil {
		return ctrl.Result{}, err
	}

	dns01 := issuer.Spec.DNS01
	if dns01 == nil {
		return ctrl.Result{}, fmt.Errorf("dns01 is empty")
	}

	err = r.reconcileSecForDNS01Issuer(ctx, issuer)
	return ctrl.Result{}, err
}

func (r *HttpsCertIssuerReconciler) reconcileSecForDNS01Issuer(
	ctx context.Context, issuer corev1alpha1.HttpsCertIssuer) error {

	dns01 := issuer.Spec.DNS01
	if dns01 == nil {
		return fmt.Errorf("dns01 is empty")
	}

	secCertMgrName := "cert-manager-acme-secret"
	secCertMgrKey := "acmedns.json"
	content, _ := json.Marshal(dns01.Configs)

	expectedSec := corev1.Secret{
		ObjectMeta: ctrl.ObjectMeta{
			Namespace: CertManagerNamespace,
			Name:      secCertMgrName,
		},
		Data: map[string][]byte{
			secCertMgrKey: content,
		},
	}

	//ensure sec is updated
	sec := corev1.Secret{}
	isNew := false

	err := r.Get(ctx, client.ObjectKey{Namespace: CertManagerNamespace, Name: secCertMgrName}, &sec)
	if err != nil {
		if errors.IsNotFound(err) {
			isNew = true
		} else {
			return err
		}
	}

	if isNew {
		sec = expectedSec
		if err := ctrl.SetControllerReference(&issuer, &sec, r.Scheme); err != nil {
			return err
		}

		err = r.Create(ctx, &sec)
	} else {
		sec.Data = expectedSec.Data
		err = r.Update(ctx, &sec)
	}

	return err
}
