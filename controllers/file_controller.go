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
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	corev1alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
)

// FileReconciler reconciles a File object
type FileReconciler struct {
	client.Client
	Log       logr.Logger
	Scheme    *runtime.Scheme
	ConfigMap *corev1.ConfigMap
}

// +kubebuilder:rbac:groups=core.kapp.dev,resources=files,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=files/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=extensions,resources=deployments;configmaps,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=extensions,resources=deployments/status,verbs=get

func (r *FileReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()
	log := r.Log.WithValues("file", req.NamespacedName)

	// your logic here
	var file corev1alpha1.File

	if err := r.Get(ctx, req.NamespacedName, &file); err != nil {
		err = client.IgnoreNotFound(err)
		if err != nil {
			log.Error(err, "unable to fetch File")
		}
		return ctrl.Result{}, err
	}

	act := newFileReconcilerTask(r, &file, req)
	return ctrl.Result{}, act.Run()
}

func (r *FileReconciler) SetupWithManager(mgr ctrl.Manager) error {
	if r.ConfigMap == nil {

	}
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.File{}).
		Owns(&corev1.ConfigMap{}).
		Complete(r)
}
