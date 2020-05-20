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
	"github.com/go-logr/logr"
	cmmeta "github.com/jetstack/cert-manager/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	cmv1alpha2 "github.com/jetstack/cert-manager/pkg/apis/certmanager/v1alpha2"
	corev1alpha1 "github.com/kapp-staging/kapp/controller/api/v1alpha1"
)

// HttpsCertReconciler reconciles a HttpsCert object
type HttpsCertReconciler struct {
	client.Client
	Log    logr.Logger
	Scheme *runtime.Scheme
}

func getCertAndCertSecretName(httpsCert corev1alpha1.HttpsCert) (certName string, certSecretName string) {
	name := httpsCert.Name

	return name, name
}

const istioNamespace = "istio-system"

// +kubebuilder:rbac:groups=core.kapp.dev,resources=httpscerts,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=httpscerts/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=cert-manager.io,resources=certificates,verbs=get;list;watch;create;update;patch;delete

func (r *HttpsCertReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()
	log := r.Log.WithValues("httpscert", req.NamespacedName)

	var httpsCert corev1alpha1.HttpsCert
	if err := r.Get(ctx, req.NamespacedName, &httpsCert); err != nil {
		err = client.IgnoreNotFound(err)
		if err != nil {
			log.Error(err, "fail to get HttpsCert")
		}

		return ctrl.Result{}, err
	}

	certName, certSecretName := getCertAndCertSecretName(httpsCert)

	// cert & it's certSecret have to be in namespace:istio-system to be found by istio
	certNS := istioNamespace

	desiredCert := cmv1alpha2.Certificate{
		ObjectMeta: metav1.ObjectMeta{
			Namespace: certNS,
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
		Namespace: certNS,
		Name:      certName,
	}, &cert)

	if err != nil {
		if !errors.IsNotFound(err) {
			return ctrl.Result{}, err
		}

		isNew = true
		cert = desiredCert
	} else {
		cert.Spec = desiredCert.Spec
	}

	if isNew {
		// todo different ns obj can't not be owner
		if err := ctrl.SetControllerReference(&httpsCert, &cert, r.Scheme); err != nil {
			return ctrl.Result{}, err
		}

		err = r.Create(ctx, &cert)
	} else {
		err = r.Update(ctx, &cert)
	}

	return ctrl.Result{}, err
}

func (r *HttpsCertReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.HttpsCert{}).
		Owns(&cmv1alpha2.Certificate{}).
		Complete(r)
}
