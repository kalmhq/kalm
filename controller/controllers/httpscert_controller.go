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
	"context"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"time"

	cmv1alpha2 "github.com/jetstack/cert-manager/pkg/apis/certmanager/v1alpha2"
	cmmeta "github.com/jetstack/cert-manager/pkg/apis/meta/v1"
	corev1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
)

// HttpsCertReconciler reconciles a HttpsCert object
type HttpsCertReconciler struct {
	*BaseReconciler
	ctx context.Context
}

func getCertAndCertSecretName(httpsCert corev1alpha1.HttpsCert) (certName string, certSecretName string) {

	name := httpsCert.Name

	if httpsCert.Spec.IsSelfManaged {
		certSecretName = httpsCert.Spec.SelfManagedCertSecretName
	} else {
		certSecretName = httpsCert.Name
	}

	return name, certSecretName
}

const istioNamespace = "istio-system"

// +kubebuilder:rbac:groups=core.kalm.dev,resources=httpscerts,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kalm.dev,resources=httpscerts/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=cert-manager.io,resources=certificates,verbs=get;list;watch;create;update;patch;delete

func (r *HttpsCertReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	var httpsCert corev1alpha1.HttpsCert
	if err := r.Get(r.ctx, req.NamespacedName, &httpsCert); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	_, certSecretName := getCertAndCertSecretName(httpsCert)

	var err error
	// self-managed httpsCert has only secret, no corresponding cmv1alpha2.Certificate
	if httpsCert.Spec.IsSelfManaged {
		// check if secret present
		var certSec corev1.Secret
		if err = r.Get(r.ctx, types.NamespacedName{
			Name:      certSecretName,
			Namespace: istioNamespace,
		}, &certSec); err != nil {
			r.Recorder.Event(&httpsCert, corev1.EventTypeWarning, "Fail to get CertSecret", err.Error())
		}

		if err != nil {
			httpsCert.Status.Conditions = []corev1alpha1.HttpsCertCondition{genConditionWithErr(err)}

			httpsCert.Status.ExpireTimestamp = 0
			httpsCert.Status.IsSignedByPublicTrustedCA = false
		} else {
			httpsCert.Status.Conditions = []corev1alpha1.HttpsCertCondition{
				{
					Type:   corev1alpha1.HttpsCertConditionReady,
					Status: corev1.ConditionTrue,
				},
			}

			cert, intermediateCert, err := ParseCert(string(certSec.Data[SecretKeyOfTLSCert]))
			if err != nil {
				httpsCert.Status.ExpireTimestamp = 0
				httpsCert.Status.IsSignedByPublicTrustedCA = false
			} else {
				isTrusted := checkIfCertIssuedByTrustedCA(cert, intermediateCert)

				httpsCert.Status.ExpireTimestamp = cert.NotAfter.Unix()
				httpsCert.Status.IsSignedByPublicTrustedCA = isTrusted
			}
		}

		r.Status().Update(r.ctx, &httpsCert)
	} else {
		// if is wildcard cert, check if acme-dns is ready
		if httpsCert.Spec.HttpsCertIssuer == corev1alpha1.DefaultDNS01IssuerName {
			ready, err := r.isACMEServerReadyForWildcardCert()
			if err != nil {
				return ctrl.Result{}, err
			}

			if !ready {
				r.Log.Info("acme server not ready yet, skipped for httpsCert:" + httpsCert.Name)
				// todo, update status to show why this cert is not requested
				return ctrl.Result{}, nil
			}
		}

		err = r.reconcileForAutoManagedHttpsCert(r.ctx, httpsCert)
	}

	return ctrl.Result{}, err
}

func NewHttpsCertReconciler(mgr ctrl.Manager) *HttpsCertReconciler {
	return &HttpsCertReconciler{
		ctx:            context.Background(),
		BaseReconciler: NewBaseReconciler(mgr, "HttpsCert"),
	}
}

type ACMEServerMapper struct {
	HttpsCertReconciler
}

func (m ACMEServerMapper) Map(object handler.MapObject) []reconcile.Request {
	if ready, err := m.isACMEServerReadyForWildcardCert(); err != nil || !ready {
		return nil
	}

	ctx := context.Background()

	var certList corev1alpha1.HttpsCertList
	if err := m.List(ctx, &certList); err != nil {
		return nil
	}

	var rst []reconcile.Request
	for _, cert := range certList.Items {
		if cert.Spec.HttpsCertIssuer != corev1alpha1.DefaultDNS01IssuerName {
			continue
		}

		rst = append(rst, reconcile.Request{
			NamespacedName: types.NamespacedName{
				Name: cert.Name,
			},
		})
	}

	return rst
}

func (r *HttpsCertReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.HttpsCert{}).
		Owns(&cmv1alpha2.Certificate{}).
		Watches(genSourceForObject(&corev1alpha1.ACMEServer{}), &handler.EnqueueRequestsFromMapFunc{
			ToRequests: ACMEServerMapper{*r},
		}).
		Complete(r)
}

func (r *HttpsCertReconciler) reconcileForAutoManagedHttpsCert(ctx context.Context, httpsCert corev1alpha1.HttpsCert) error {
	certName, certSecretName := getCertAndCertSecretName(httpsCert)

	dnsNames := getDNSNames(httpsCert)
	commonName := pickCommonName(dnsNames)

	desiredCert := cmv1alpha2.Certificate{
		ObjectMeta: metav1.ObjectMeta{
			Namespace: istioNamespace,
			Name:      certName,
		},
		Spec: cmv1alpha2.CertificateSpec{
			SecretName: certSecretName,
			CommonName: commonName,
			DNSNames:   dnsNames,
			IssuerRef: cmmeta.ObjectReference{
				Name: httpsCert.Spec.HttpsCertIssuer,
				Kind: "ClusterIssuer",
			},
		},
	}

	// reconcile cert
	var cert cmv1alpha2.Certificate
	var isNew bool
	err := r.Get(ctx, types.NamespacedName{
		Namespace: istioNamespace,
		Name:      certName,
	}, &cert)

	if err != nil {
		if !errors.IsNotFound(err) {
			return err
		}

		isNew = true
		cert = desiredCert
	} else {
		cert.Spec = desiredCert.Spec
	}

	if isNew {
		if err := ctrl.SetControllerReference(&httpsCert, &cert, r.Scheme); err != nil {
			return err
		}

		err = r.Create(ctx, &cert)
	} else {
		err = r.Update(ctx, &cert)
	}

	if err != nil {
		httpsCert.Status.Conditions = []corev1alpha1.HttpsCertCondition{
			genConditionWithErr(err),
		}
	} else {
		// check status of underlining cert
		err := r.Get(ctx, types.NamespacedName{Namespace: istioNamespace, Name: certName}, &cert)
		if err != nil {
			httpsCert.Status.Conditions = []corev1alpha1.HttpsCertCondition{
				genConditionWithErr(err),
			}
		} else {
			for _, cond := range cert.Status.Conditions {
				if cond.Type != cmv1alpha2.CertificateConditionReady {
					continue
				}

				httpsCert.Status.Conditions = []corev1alpha1.HttpsCertCondition{transCertCondition(cond)}

				if cond.Status == cmmeta.ConditionTrue {
					var certSec corev1.Secret
					err := r.Get(
						ctx,
						client.ObjectKey{Name: cert.Spec.SecretName, Namespace: istioNamespace},
						&certSec,
					)
					if err != nil {
						return err
					}

					cert, interCert, err := ParseCert(string(certSec.Data[SecretKeyOfTLSCert]))

					expireAt := cert.NotAfter
					isTrusted := checkIfCertIssuedByTrustedCA(cert, interCert)

					httpsCert.Status.ExpireTimestamp = expireAt.Unix()
					httpsCert.Status.IsSignedByPublicTrustedCA = isTrusted
				} else {
					// cert is not ready yet, reset fields
					httpsCert.Status.ExpireTimestamp = 0
					httpsCert.Status.IsSignedByPublicTrustedCA = false
				}

				break
			}
		}
	}

	r.Status().Update(ctx, &httpsCert)

	return err
}

func (r *HttpsCertReconciler) isACMEServerReadyForWildcardCert() (bool, error) {
	ctx := context.Background()

	var acmeServerList corev1alpha1.ACMEServerList
	err := r.List(ctx, &acmeServerList)
	if err != nil {
		return false, err
	}

	if len(acmeServerList.Items) != 1 {
		return false, nil
	}

	server := acmeServerList.Items[0]
	if !server.Status.Ready {
		return false, nil
	}

	return true, nil
}

func pickCommonName(names []string) string {
	if len(names) <= 0 {
		return ""
	}

	return names[0]
}

func getDNSNames(httpsCert corev1alpha1.HttpsCert) (dnsNames []string) {
	return httpsCert.Spec.Domains
}

func checkIfCertIssuedByTrustedCA(cert, intermediateCert *x509.Certificate, fakeTimeOpt ...time.Time) bool {
	roots, err := x509.SystemCertPool()
	if err != nil {
		return false
	}

	interPool := x509.NewCertPool()
	if intermediateCert != nil {
		interPool.AddCert(intermediateCert)
	}

	opts := x509.VerifyOptions{
		DNSName:       cert.Subject.CommonName,
		Intermediates: interPool,
		Roots:         roots,
	}

	if len(fakeTimeOpt) >= 1 {
		opts.CurrentTime = fakeTimeOpt[0]
	}

	if _, err := cert.Verify(opts); err != nil {
		fmt.Println(err, "failed to verify certificate")
		return false
	}

	return true
}

func genConditionWithErr(err error) corev1alpha1.HttpsCertCondition {
	return corev1alpha1.HttpsCertCondition{
		Type:    corev1alpha1.HttpsCertConditionReady,
		Status:  corev1.ConditionFalse,
		Reason:  "APIFail",
		Message: err.Error(),
	}
}

func transCertCondition(cond cmv1alpha2.CertificateCondition) corev1alpha1.HttpsCertCondition {
	return corev1alpha1.HttpsCertCondition{
		Type:    corev1alpha1.HttpsCertConditionReady,
		Status:  corev1.ConditionStatus(cond.Status),
		Reason:  cond.Reason,
		Message: cond.Message,
	}
}

func ParseCert(certPEM string) (cert, intermediateCert *x509.Certificate, err error) {

	block, rest := pem.Decode([]byte(certPEM))
	if block == nil {
		return nil, nil, fmt.Errorf("failed to parse certificate PEM")
	}

	cert, err = x509.ParseCertificate(block.Bytes)
	if err != nil {
		return nil, nil, err
	}

	if rest != nil && len(rest) > 0 {
		restBlock, _ := pem.Decode(rest)

		if restBlock != nil {
			if intermediateCert, err := x509.ParseCertificate(restBlock.Bytes); err != nil {
				return cert, nil, nil
			} else {
				return cert, intermediateCert, nil
			}
		}
	}

	return cert, nil, nil
}
