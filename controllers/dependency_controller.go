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
	"fmt"
	"github.com/go-logr/logr"
	"k8s.io/api/extensions/v1beta1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	corev1alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
)

// DependencyReconciler reconciles a Dependency object
type DependencyReconciler struct {
	client.Client
	Log    logr.Logger
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=core.kapp.dev,resources=dependencies,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=dependencies/status,verbs=get;update;patch

func (r *DependencyReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()
	log := r.Log.WithValues("dependency", req.NamespacedName)

	// your logic here
	log.Info("reconciling dep")

	dep := corev1alpha1.Dependency{}
	fmt.Println("aaaaaaaaaaaaa")
	if err := r.Get(ctx, req.NamespacedName, &dep); err != nil {
		fmt.Println("err:", err)

		switch t := err.(type) {
		default:
			fmt.Println("type of err", fmt.Sprintf("%+v", t))
		}

		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	fmt.Println("bbbbbbbbbb")
	fmt.Printf("dep: %+v", dep)

	switch dep.Spec.Type {
	case "kong":
		if err := r.reconcileKong(ctx, &dep); err != nil {
			return ctrl.Result{}, err
		}
	default:
		return ctrl.Result{}, fmt.Errorf("unkonwn dependency: %s", dep.Spec.Type)
	}

	return ctrl.Result{}, nil
}

func (r *DependencyReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.Dependency{}).
		Complete(r)
}

// 1. check if dependency is installed
// 2. collect components info and update kong config
func (r *DependencyReconciler) reconcileKong(ctx context.Context, dep *corev1alpha1.Dependency) error {
	isInstalled, err := r.isKongControllerInstalled()
	if err != nil {
		return err
	}

	if !isInstalled {
		dep.Status = corev1alpha1.DependencyStatus{
			Status: "pending",
			ErrMsg: "kong controller not installed yet",
		}

		if err := r.Status().Update(ctx, dep); err != nil {
			r.Log.Error(err, "fail to update status")
			return client.IgnoreNotFound(err)
		}

		return nil
	}

	var kappList corev1alpha1.ApplicationList
	if err := r.List(ctx, &kappList, client.InNamespace("")); err != nil {
		return nil
	}

	r.Log.Info("kapps", "size:", len(kappList.Items))
	// collect ingress info & update kong

	ns2ingPluginsMap := make(map[string][]*corev1alpha1.PluginIngress)
	for _, kapp := range kappList.Items {
		ns := kapp.Namespace

		if existPlugins, exist := ns2ingPluginsMap[ns]; !exist {
			ns2ingPluginsMap[ns] = GetIngressPlugins(&kapp)
		} else {
			ns2ingPluginsMap[ns] = append(existPlugins, GetIngressPlugins(&kapp)...)
		}
	}

	r.Log.Info("ns2ingPluginsMap", "size:", len(ns2ingPluginsMap))

	for ns, ingPlugins := range ns2ingPluginsMap {
		if len(ingPlugins) <= 0 {
			continue
		}

		r.Log.Info("plugins",
			"ns", ns,
			"size:", len(ingPlugins),
			"1stPlugin", ingPlugins)

		ing, exist, err := r.getIngress(ctx, dep, ingPlugins)
		if err != nil {
			return err
		}

		if !exist {
			if err := r.Create(ctx, ing); err != nil {
				return err
			}
		} else {
			if err := r.Update(ctx, ing); err != nil {
				return err
			}
		}
	}

	return nil
}

func (r *DependencyReconciler) isKongControllerInstalled() (bool, error) {
	//todo
	return true, nil
}

func (r *DependencyReconciler) getIngress(
	ctx context.Context,
	dep *corev1alpha1.Dependency,
	ingPlugins []*corev1alpha1.PluginIngress,
) (*v1beta1.Ingress, bool, error) {

	ns := ingPlugins[0].Namespace

	ing := v1beta1.Ingress{}
	if err := r.Get(ctx, types.NamespacedName{Namespace: ns, Name: dep.Name}, &ing); err != nil {
		if !errors.IsNotFound(err) {
			return nil, false, err
		}

		ing := r.desiredIngress(dep, ingPlugins)

		return &ing, false, nil
	}

	//todo make sure config matches

	return &ing, false, nil
}

func (r *DependencyReconciler) desiredIngress(
	dep *corev1alpha1.Dependency,
	ingPlugins []*corev1alpha1.PluginIngress,
) v1beta1.Ingress {

	ns := ingPlugins[0].Namespace

	var rules []v1beta1.IngressRule
	for _, ingPlugin := range ingPlugins {
		rules = append(rules, GenRulesOfIngressPlugin(ingPlugin)...)
	}

	ing := v1beta1.Ingress{
		TypeMeta: v1.TypeMeta{APIVersion: v1beta1.SchemeGroupVersion.String(), Kind: "Ingress"},
		ObjectMeta: v1.ObjectMeta{
			Name:      dep.Name,
			Namespace: ns,
		},
		Spec: v1beta1.IngressSpec{
			//Backend: &v1beta1.IngressBackend{
			//	ServiceName: "",
			//	ServicePort: intstr.IntOrString{},
			//},
			Rules: rules,
		},
	}

	return ing
}
