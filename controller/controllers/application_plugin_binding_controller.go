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
	"github.com/kapp-staging/kapp/controller/utils"
	"github.com/xeipuuv/gojsonschema"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/types"
	"time"

	"github.com/go-logr/logr"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	corev1alpha1 "github.com/kapp-staging/kapp/controller/api/v1alpha1"
)

// ApplicationPluginBindingReconciler reconciles a ApplicationPluginBinding object
type ApplicationPluginBindingReconciler struct {
	client.Client
	Log    logr.Logger
	Scheme *runtime.Scheme
	Reader client.Reader
}

// +kubebuilder:rbac:groups=core.kapp.dev,resources=applicationpluginbindings,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=applicationpluginbindings/status,verbs=get;update;patch

func (r *ApplicationPluginBindingReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()
	log := r.Log.WithValues("applicationPluginBinding", req.NamespacedName)

	var pluginBinding corev1alpha1.ApplicationPluginBinding

	if err := r.Get(ctx, req.NamespacedName, &pluginBinding); err != nil {
		err = client.IgnoreNotFound(err)

		if err != nil {
			log.Error(err, "unable to fetch ApplicationPlugin Binding")
		}

		return ctrl.Result{}, err
	}

	if pluginBinding.ObjectMeta.DeletionTimestamp.IsZero() {
		// after create
		if !utils.ContainsString(pluginBinding.ObjectMeta.Finalizers, finalizerName) {
			pluginBinding.ObjectMeta.Finalizers = append(pluginBinding.ObjectMeta.Finalizers, finalizerName)
			if pluginBinding.ObjectMeta.Labels == nil {
				pluginBinding.ObjectMeta.Labels = make(map[string]string)
			}

			pluginBinding.ObjectMeta.Labels["kapp-plugin"] = pluginBinding.Spec.PluginName

			if err := r.Update(ctx, &pluginBinding); err != nil {
				log.Error(err, "update plugin binding error.")
				return ctrl.Result{}, err
			}

			if err := r.TouchApplication(ctx, &pluginBinding, log); err != nil {
				log.Error(err, "Touch applications error.")
				return ctrl.Result{}, err
			}

			return ctrl.Result{}, nil
		}

		return ctrl.Result{}, r.UpdatePluginBinding(ctx, &pluginBinding, log)
	} else {
		// before delete
		if utils.ContainsString(pluginBinding.ObjectMeta.Finalizers, finalizerName) {

			if err := r.TouchApplication(ctx, &pluginBinding, log); err != nil {
				if !errors.IsNotFound(err) {
					log.Error(err, "Touch applications error.")
					return ctrl.Result{}, err
				}
			}

			// remove our finalizer from the list and update it.
			pluginBinding.ObjectMeta.Finalizers = utils.RemoveString(pluginBinding.ObjectMeta.Finalizers, finalizerName)
			err := r.Update(ctx, &pluginBinding)
			return ctrl.Result{}, err
		}

		return ctrl.Result{}, nil
	}
}

func (r *ApplicationPluginBindingReconciler) TouchApplication(ctx context.Context, pluginBinding *corev1alpha1.ApplicationPluginBinding, log logr.Logger) error {
	var application corev1alpha1.Application

	err := r.Reader.Get(ctx, types.NamespacedName{
		Name: pluginBinding.Namespace,
	}, &application)

	if err != nil {
		return err
	}

	applicationCopy := application.DeepCopy()

	if applicationCopy.Annotations == nil {
		applicationCopy.ObjectMeta.Annotations = make(map[string]string)
	}

	applicationCopy.ObjectMeta.Annotations["touchedByPluginBinding"] = time.Now().String()

	return r.Patch(ctx, applicationCopy, client.MergeFrom(&application))
}

func (r *ApplicationPluginBindingReconciler) UpdatePluginBinding(ctx context.Context, pluginBinding *corev1alpha1.ApplicationPluginBinding, log logr.Logger) error {
	pluginProgram := applicationPluginsCache.Get(pluginBinding.Spec.PluginName)

	if pluginProgram == nil {
		return nil
	}

	isConfigValid := true
	var configError string

	if pluginProgram.ConfigSchema != nil {
		if pluginBinding.Spec.Config == nil {
			isConfigValid = false
			configError = "Configuration is required."
		} else {
			pluginConfig := gojsonschema.NewStringLoader(string(pluginBinding.Spec.Config.Raw))
			res, err := pluginProgram.ConfigSchema.Validate(pluginConfig)

			if err != nil {
				isConfigValid = false
				configError = err.Error()
			} else {
				if !res.Valid() {
					isConfigValid = false
					configError = res.Errors()[0].String()
				}
			}
		}
	}

	pluginBindingCopy := pluginBinding.DeepCopy()
	pluginBindingCopy.Status.ConfigError = configError
	pluginBindingCopy.Status.ConfigValid = isConfigValid

	if err := r.Patch(ctx, pluginBindingCopy, client.MergeFrom(pluginBinding)); err != nil {
		log.Error(err, "Patch plugin binding status error.")
		return err
	}

	return r.TouchApplication(ctx, pluginBinding, log)
}

func (r *ApplicationPluginBindingReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.ApplicationPluginBinding{}).
		Complete(r)
}
