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
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
	"sigs.k8s.io/controller-runtime/pkg/source"
	"strconv"
	"time"

	ctrl "sigs.k8s.io/controller-runtime"
)

const (
	KalmEnableLabelName  = "kalm-enabled"
	KalmEnableLabelValue = "true"

	IstioInjectionLabelName        = "istio-injection"
	IstioInjectionLabelEnableValue = "enabled"
)

// KalmNSReconciler watches all namespaces
type KalmNSReconciler struct {
	*BaseReconciler
	ctx context.Context
}

func NewKalmNSReconciler(mgr ctrl.Manager) *KalmNSReconciler {
	return &KalmNSReconciler{
		BaseReconciler: NewBaseReconciler(mgr, "KalmNS"),
		ctx:            context.Background(),
	}
}

// resource change needs trigger reconcile
type MapAll struct{}

func (m MapAll) Map(_ handler.MapObject) []reconcile.Request {
	return []reconcile.Request{{NamespacedName: types.NamespacedName{}}}
}

func (r *KalmNSReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&v1.Namespace{}).
		Watches(&source.Kind{Type: &v1alpha1.HttpsCertIssuer{}}, &handler.EnqueueRequestsFromMapFunc{
			ToRequests: MapAll{},
		}).
		Watches(&source.Kind{Type: &v1alpha1.HttpsCert{}}, &handler.EnqueueRequestsFromMapFunc{
			ToRequests: MapAll{},
		}).
		Complete(r)
}

// +kubebuilder:rbac:groups="",resources=namespaces,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=metrics.k8s.io,resources=*,verbs=get;list;watch

func (r *KalmNSReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := r.ctx
	logger := r.Log.WithValues("kalmns", req.NamespacedName)

	logger.Info("kalm ns reconciling...")

	var namespaceList v1.NamespaceList
	if err := r.List(ctx, &namespaceList); err != nil {
		err = client.IgnoreNotFound(err)
		return ctrl.Result{}, err
	}

	now := time.Now()

	for _, ns := range namespaceList.Items {
		_, exist := ns.Labels[KalmEnableLabelName]
		if !exist {
			continue
		}

		if v, exist := ns.Labels[IstioInjectionLabelName]; !exist || v != IstioInjectionLabelEnableValue {
			deepCopiedNs := ns.DeepCopy()
			deepCopiedNs.Labels[IstioInjectionLabelName] = IstioInjectionLabelEnableValue
			if err := r.Update(ctx, deepCopiedNs); err != nil {
				return ctrl.Result{}, err
			}
		}

		var compList v1alpha1.ComponentList
		if err := r.List(ctx, &compList, client.InNamespace(ns.Name)); client.IgnoreNotFound(err) != nil {
			return ctrl.Result{}, err
		}

		isActive := IsNamespaceKalmEnabled(ns)

		for _, item := range compList.Items {
			component := item.DeepCopy()
			if component.Labels == nil {
				component.Labels = map[string]string{}
			}

			var suffix string
			if isActive {
				suffix = "enabled"
			} else {
				suffix = "disabled"
			}

			component.Labels["kalm-namespace-updated-at"] = strconv.Itoa(int(now.Unix())) + "-" + suffix

			if err := r.Update(ctx, component); err != nil {
				return ctrl.Result{}, err
			}
		}
	}

	// check if default caIssuer & cert is created
	if err := r.reconcileDefaultCAIssuerAndCert(); err != nil {
		return ctrl.Result{}, err
	}

	if err := r.reconcileDefaultHTTP01Issuer(); err != nil {
		return ctrl.Result{}, err
	}

	return ctrl.Result{}, nil
}

func (r *KalmNSReconciler) reconcileDefaultCAIssuerAndCert() error {
	defaultCAIssuerName := "default-cert-issuer"

	expectedCAIssuer := v1alpha1.HttpsCertIssuer{
		ObjectMeta: metav1.ObjectMeta{
			Name: defaultCAIssuerName,
		},
		Spec: v1alpha1.HttpsCertIssuerSpec{
			CAForTest: &v1alpha1.CAForTestIssuer{},
		},
	}

	currentCAIssuer := v1alpha1.HttpsCertIssuer{}
	err := r.Get(r.ctx, types.NamespacedName{Name: defaultCAIssuerName}, &currentCAIssuer)
	if err != nil {
		if !errors.IsNotFound(err) {
			return err
		}

		if err := r.Create(r.ctx, &expectedCAIssuer); err != nil {
			return err
		}
	} else {
		currentCAIssuer.Spec = expectedCAIssuer.Spec
		if err := r.Update(r.ctx, &currentCAIssuer); err != nil {
			return err
		}
	}

	defaultCertName := "default-https-cert"
	expectedCert := v1alpha1.HttpsCert{
		ObjectMeta: metav1.ObjectMeta{
			Name: defaultCertName,
		},
		Spec: v1alpha1.HttpsCertSpec{
			HttpsCertIssuer: defaultCAIssuerName,
			Domains:         []string{"*"},
		},
	}

	var currentCert v1alpha1.HttpsCert
	if err = r.Get(r.ctx, types.NamespacedName{Name: defaultCertName}, &currentCert); err != nil {
		if !errors.IsNotFound(err) {
			return err
		}

		return r.Create(r.ctx, &expectedCert)
	} else {
		currentCert.Spec = expectedCert.Spec
		return r.Update(r.ctx, &currentCert)
	}
}

var DefaultHTTP01IssuerName = "default-http01-issuer"

func (r *KalmNSReconciler) reconcileDefaultHTTP01Issuer() error {

	expectedHTTP01Issuer := v1alpha1.HttpsCertIssuer{
		ObjectMeta: metav1.ObjectMeta{
			Name: DefaultHTTP01IssuerName,
		},
		Spec: v1alpha1.HttpsCertIssuerSpec{
			HTTP01: &v1alpha1.HTTP01Issuer{},
		},
	}

	currentIssuer := v1alpha1.HttpsCertIssuer{}
	err := r.Get(r.ctx, types.NamespacedName{Name: DefaultHTTP01IssuerName}, &currentIssuer)
	if err != nil {
		if !errors.IsNotFound(err) {
			return err
		}

		if err := r.Create(r.ctx, &expectedHTTP01Issuer); err != nil {
			return err
		}
	} else {
		currentIssuer.Spec = expectedHTTP01Issuer.Spec
		if err := r.Update(r.ctx, &currentIssuer); err != nil {
			return err
		}
	}

	return nil
}
