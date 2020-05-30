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
	cmmeta "github.com/jetstack/cert-manager/pkg/apis/meta/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	cmv1alpha2 "github.com/jetstack/cert-manager/pkg/apis/certmanager/v1alpha2"
	corev1alpha1 "github.com/kapp-staging/kapp/controller/api/v1alpha1"
)

// HttpsCertReconciler reconciles a HttpsCert object
type HttpsCertReconciler struct {
	*BaseReconciler
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

// +kubebuilder:rbac:groups=core.kapp.dev,resources=httpscerts,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=httpscerts/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=cert-manager.io,resources=certificates,verbs=get;list;watch;create;update;patch;delete

func (r *HttpsCertReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()

	var httpsCert corev1alpha1.HttpsCert
	if err := r.Get(ctx, req.NamespacedName, &httpsCert); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	_, certSecretName := getCertAndCertSecretName(httpsCert)

	var err error
	// self-managed httpsCert has only secret, no corresponding cmv1alpha2.Certificate
	if httpsCert.Spec.IsSelfManaged {
		// check if secret present
		var certSec corev1.Secret
		if err = r.Get(ctx, types.NamespacedName{
			Name:      certSecretName,
			Namespace: istioNamespace,
		}, &certSec); err != nil {
			r.Recorder.Event(&httpsCert, corev1.EventTypeWarning, "Fail to get CertSecret", err.Error())
		}

		if err != nil {
			httpsCert.Status.Conditions = []corev1alpha1.HttpsCertCondition{genConditionWithErr(err)}
		} else {
			httpsCert.Status.Conditions = []corev1alpha1.HttpsCertCondition{
				{
					Type:   corev1alpha1.HttpsCertConditionReady,
					Status: corev1.ConditionTrue,
				},
			}
		}

		r.Status().Update(ctx, &httpsCert)
	} else {
		err = r.reconcileForAutoManagedHttpsCert(ctx, httpsCert)
	}

	return ctrl.Result{}, err
}

func NewHttpsCertReconciler(mgr ctrl.Manager) *HttpsCertReconciler {
	return &HttpsCertReconciler{
		BaseReconciler: NewBaseReconciler(mgr, "HttpsCert"),
	}
}

func (r *HttpsCertReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.HttpsCert{}).
		Owns(&cmv1alpha2.Certificate{}).
		Complete(r)
}

func (r *HttpsCertReconciler) reconcileForAutoManagedHttpsCert(ctx context.Context, httpsCert corev1alpha1.HttpsCert) error {
	certName, certSecretName := getCertAndCertSecretName(httpsCert)

	desiredCert := cmv1alpha2.Certificate{
		ObjectMeta: metav1.ObjectMeta{
			Namespace: istioNamespace,
			Name:      certName,
		},
		Spec: cmv1alpha2.CertificateSpec{
			SecretName: certSecretName,
			DNSNames:   httpsCert.Spec.Domains,
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
		if err := r.Get(ctx, types.NamespacedName{Namespace: istioNamespace, Name: certName}, &cert); err != nil {
			httpsCert.Status.Conditions = []corev1alpha1.HttpsCertCondition{
				genConditionWithErr(err),
			}
		} else {
			for _, cond := range cert.Status.Conditions {
				if cond.Type != cmv1alpha2.CertificateConditionReady {
					continue
				}

				httpsCert.Status.Conditions = []corev1alpha1.HttpsCertCondition{transCertCondition(cond)}
				break
			}
		}
	}

	r.Status().Update(ctx, &httpsCert)

	return err
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
