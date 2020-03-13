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
	corev1alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
	"k8s.io/api/extensions/v1beta1"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/source"
)

// DependencyReconciler reconciles a Dependency object
type DependencyReconciler struct {
	client.Client
	Log    logr.Logger
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=core.kapp.dev,resources=dependencies,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=dependencies/status,verbs=get;update;patch
// +kubebuilder:rbac:groups="",resources=secrets,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="cert-manager.io",resources=clusterissuers,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="extensions",resources=ingresses,verbs=get;list;watch;create;update;patch;delete

func (r *DependencyReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()
	log := r.Log.WithValues("dependency", req.NamespacedName)

	// your logic here
	log.Info("reconciling dep")

	dep := corev1alpha1.Dependency{}
	if err := r.Get(ctx, req.NamespacedName, &dep); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	switch dep.Spec.Type {
	case "kong":
		if err := r.reconcileKong(ctx, &dep); err != nil {
			return returnRstForError(err)
		}
	case "cert-manager":
		if err := r.reconcileCertManager(ctx, &dep); err != nil {
			return returnRstForError(err)
		}
	case "kube-prometheus":
		if err := r.reconcileKubePrometheus(ctx, &dep); err != nil {
			return returnRstForError(err)
		}
	default:
		log.Error(fmt.Errorf("unkonwn dependency: %s", dep.Spec.Type), "ignored")
	}

	return ctrl.Result{}, nil
}

func (r *DependencyReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.Dependency{}).
		//Owns(&cmv1alpha2.ClusterIssuer{}).
		Owns(&v1beta1.Ingress{}).
		Watches(
			&source.Kind{Type: &corev1alpha1.Application{}},
			//&handler.EnqueueRequestForObject{},
			&handler.EnqueueRequestsFromMapFunc{
				ToRequests: handler.ToRequestsFunc(func(obj handler.MapObject) []ctrl.Request {
					var list corev1alpha1.DependencyList
					if err := r.List(context.TODO(), &list); err != nil {
						return nil
					}

					res := make([]ctrl.Request, len(list.Items))
					for i, dep := range list.Items {
						res[i].Name = dep.Name
						res[i].Namespace = dep.Namespace
					}

					r.Log.Info("watch applications", "enqueue reqs", len(res), "reqs", res)

					return res
				}),
			},
		).
		Complete(r)
}
