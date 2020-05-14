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
	"github.com/kapp-staging/kapp/controller/registry"
	"github.com/kapp-staging/kapp/controller/utils"
	v1 "k8s.io/api/core/v1"
	types "k8s.io/apimachinery/pkg/types"

	"github.com/go-logr/logr"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	corev1alpha1 "github.com/kapp-staging/kapp/controller/api/v1alpha1"
)

// DockerRegistryReconciler reconciles a DockerRegistry object
type DockerRegistryReconciler struct {
	client.Client
	Reader client.Reader
	Log    logr.Logger
	Scheme *runtime.Scheme
}

type DockerRegistryReconcileTask struct {
	*DockerRegistryReconciler
	Log      logr.Logger
	ctx      context.Context
	registry *corev1alpha1.DockerRegistry
	secret   *v1.Secret
}

func (r *DockerRegistryReconcileTask) Run(req ctrl.Request) error {
	if err := r.SetupAttributes(req); err != nil {
		return client.IgnoreNotFound(err)
	}

	if err := r.LoadResources(req); err != nil {
		return err
	}

	if err := r.HandleDelete(); err != nil {
		return err
	}

	if !r.registry.ObjectMeta.DeletionTimestamp.IsZero() {
		return nil
	}

	registryInstance := registry.NewRegistry(r.registry.Spec.Host, string(r.secret.Data["username"]), string(r.secret.Data["password"]))

	if err := registryInstance.Ping(); err != nil {
		r.registry.Status.AuthenticationVerified = false

		// todo save & exit

		registryCopy := r.registry.DeepCopy()
		registryCopy.Status.AuthenticationVerified = false

		if err := r.Patch(r.ctx, registryCopy, client.MergeFrom(r.registry)); err != nil {
			r.Log.Error(err, "Patch docker registry status error.")
			return err
		}

		return nil
	}

	repos, err := registryInstance.Repositories()

	if err != nil {
		return err
	}

	var repositories []*corev1alpha1.Repository
	for _, repo := range repos {
		repositories = append(repositories, &corev1alpha1.Repository{
			Name: repo,
			Tags: []corev1alpha1.RepositoryTag{},
		})
	}

	registryCopy := r.registry.DeepCopy()
	registryCopy.Status.AuthenticationVerified = true
	registryCopy.Status.Repositories = repositories

	if err := r.Patch(r.ctx, registryCopy, client.MergeFrom(r.registry)); err != nil {
		r.Log.Error(err, "Patch docker registry status error.")
		return err
	}

	return nil
}

func (r *DockerRegistryReconcileTask) LoadResources(req ctrl.Request) (err error) {
	var secret v1.Secret
	err = r.Reader.Get(r.ctx, types.NamespacedName{
		Namespace: "kapp-system",
		Name:      fmt.Sprintf("%s-authentication", req.Name),
	}, &secret)

	// TODO if can't find, emit a warning event

	if err != nil {
		return err
	}

	r.secret = &secret
	return
}

func (r *DockerRegistryReconcileTask) HandleDelete() (err error) {
	if r.registry.ObjectMeta.DeletionTimestamp.IsZero() {
		if !utils.ContainsString(r.registry.ObjectMeta.Finalizers, finalizerName) {
			r.registry.ObjectMeta.Finalizers = append(r.registry.ObjectMeta.Finalizers, finalizerName)
			if err := r.Update(r.ctx, r.registry); err != nil {
				return err
			}
		}
	} else {
		if utils.ContainsString(r.registry.ObjectMeta.Finalizers, finalizerName) {
			//if err := r.DeleteResources(); err != nil {
			//	return err
			//}

			r.registry.ObjectMeta.Finalizers = utils.RemoveString(r.registry.ObjectMeta.Finalizers, finalizerName)
			if err := r.Update(r.ctx, r.registry); err != nil {
				return err
			}
		}
	}

	return nil
}

func (r *DockerRegistryReconcileTask) SetupAttributes(req ctrl.Request) (err error) {
	var registry corev1alpha1.DockerRegistry
	err = r.Reader.Get(r.ctx, req.NamespacedName, &registry)

	if err != nil {
		return err
	}
	r.registry = &registry
	return
}

// +kubebuilder:rbac:groups=core.kapp.dev,resources=dockerregistries,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=dockerregistries/status,verbs=get;update;patch
// +kubebuilder:rbac:groups="",resources=secrets,verbs=get;list;watch;create;update;patch;delete

func (r *DockerRegistryReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	task := &DockerRegistryReconcileTask{
		DockerRegistryReconciler: r,
		ctx:                      context.Background(),
		Log:                      r.Log.WithValues("dockerregistry", req.NamespacedName),
	}

	return ctrl.Result{}, task.Run(req)
}

func (r *DockerRegistryReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.DockerRegistry{}).
		Complete(r)
}
