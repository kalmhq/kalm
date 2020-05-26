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
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	v1 "k8s.io/api/core/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"strconv"
	"time"

	ctrl "sigs.k8s.io/controller-runtime"
)

// KappNSReconciler reconciles a KappNS object
type KappNSReconciler struct {
	//client.Client
	//Log    logr.Logger
	//Scheme *runtime.Scheme
	*BaseReconciler
}

func NewKappNSReconciler(mgr ctrl.Manager) *KappNSReconciler {
	return &KappNSReconciler{
		NewBaseReconciler(mgr, "KappNS"),
	}
}

func (r *KappNSReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()
	_ = r.Log.WithValues("kappns", req.NamespacedName)

	// your logic here
	fmt.Println("kapp ns reconciling...")

	var namespaceList v1.NamespaceList
	if err := r.List(ctx, &namespaceList); err != nil {
		err = client.IgnoreNotFound(err)
		return ctrl.Result{}, err
	}

	now := time.Now()

	for _, ns := range namespaceList.Items {
		_, exist := ns.Labels[KappEnableLabelName]
		if !exist {
			continue
		}

		var compList v1alpha1.ComponentList
		if err := r.List(ctx, &compList, client.InNamespace(ns.Name)); client.IgnoreNotFound(err) != nil {
			return ctrl.Result{}, err
		}

		for _, item := range compList.Items {
			component := item.DeepCopy()
			if component.Labels == nil {
				component.Labels = map[string]string{}
			}

			component.Labels["kapp-namespace-updated-at"] = strconv.Itoa(int(now.Unix()))
			if err := r.Update(ctx, component); err != nil {
				return ctrl.Result{}, err
			}
		}
	}

	return ctrl.Result{}, nil
}

func (r *KappNSReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&v1.Namespace{}).
		Complete(r)
}
