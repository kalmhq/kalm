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
	"github.com/kapp-staging/kapp/util"
	"github.com/xeipuuv/gojsonschema"
	"k8s.io/apimachinery/pkg/types"
	"time"

	"github.com/go-logr/logr"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	corev1alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
)

// ComponentPluginBindingReconciler reconciles a ComponentPluginBinding object
type ComponentPluginBindingReconciler struct {
	client.Client
	Log    logr.Logger
	Scheme *runtime.Scheme
	Reader client.Reader
}

// +kubebuilder:rbac:groups=core.kapp.dev,resources=componentpluginbindings,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=componentpluginbindings/status,verbs=get;update;patch

func (r *ComponentPluginBindingReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()
	log := r.Log.WithValues("pluginbinding", req.NamespacedName)

	var pluginBinding corev1alpha1.ComponentPluginBinding

	if err := r.Get(ctx, req.NamespacedName, &pluginBinding); err != nil {
		err = client.IgnoreNotFound(err)

		if err != nil {
			log.Error(err, "unable to fetch ComponentPlugin Binding")
		}

		return ctrl.Result{}, err
	}

	if pluginBinding.ObjectMeta.DeletionTimestamp.IsZero() {
		// after create
		if !util.ContainsString(pluginBinding.ObjectMeta.Finalizers, finalizerName) {
			pluginBinding.ObjectMeta.Finalizers = append(pluginBinding.ObjectMeta.Finalizers, finalizerName)
			if pluginBinding.ObjectMeta.Labels == nil {
				pluginBinding.ObjectMeta.Labels = make(map[string]string)
			}

			pluginBinding.ObjectMeta.Labels["kapp-plugin"] = pluginBinding.Spec.PluginName

			if pluginBinding.Spec.ComponentName != "" {
				pluginBinding.ObjectMeta.Labels["kapp-component"] = pluginBinding.Spec.ComponentName
			}

			if err := r.Update(context.Background(), &pluginBinding); err != nil {
				log.Error(err, "update plugin binding error.")
				return ctrl.Result{}, err
			}

			if err := r.TouchComponents(ctx, &pluginBinding, log); err != nil {
				log.Error(err, "Touch components error.")
				return ctrl.Result{}, err
			}

			return ctrl.Result{}, nil
		}

		return ctrl.Result{}, r.UpdatePluginBinding(ctx, &pluginBinding, log)
	} else {
		// before delete
		if util.ContainsString(pluginBinding.ObjectMeta.Finalizers, finalizerName) {

			if err := r.TouchComponents(ctx, &pluginBinding, log); err != nil {
				log.Error(err, "Touch components error.")
				return ctrl.Result{}, err
			}

			// remove our finalizer from the list and update it.
			pluginBinding.ObjectMeta.Finalizers = util.RemoveString(pluginBinding.ObjectMeta.Finalizers, finalizerName)
			err := r.Update(ctx, &pluginBinding)
			return ctrl.Result{}, err
		}

		return ctrl.Result{}, nil
	}
}

//func (r *ComponentPluginBindingReconciler) TouchSubject(ctx context.Context, pluginBinding *corev1alpha1.ComponentPluginBinding, log logr.Logger)error {
//
//}

func (r *ComponentPluginBindingReconciler) TouchComponents(ctx context.Context, pluginBinding *corev1alpha1.ComponentPluginBinding, log logr.Logger) error {
	if pluginBinding.Spec.ComponentName == "" {
		var componentList corev1alpha1.ComponentList
		err := r.Reader.List(ctx, &componentList, client.InNamespace(pluginBinding.Namespace))
		if err != nil {
			log.Error(err, "get component list error.")
			return err
		}

		for _, component := range componentList.Items {
			_ = r.TouchComponent(ctx, &component)
		}
	} else {
		var component corev1alpha1.Component
		err := r.Reader.Get(ctx, types.NamespacedName{
			Namespace: pluginBinding.Namespace,
			Name:      pluginBinding.Spec.ComponentName,
		}, &component)

		if err != nil {
			log.Error(err, "get component error.")
			return err
		}

		_ = r.TouchComponent(ctx, &component)
	}

	return nil
}

func (r *ComponentPluginBindingReconciler) TouchComponent(ctx context.Context, component *corev1alpha1.Component) error {
	componentCopy := component.DeepCopy()

	if componentCopy.Annotations == nil {
		componentCopy.ObjectMeta.Annotations = make(map[string]string)
	}

	componentCopy.ObjectMeta.Annotations["touchedByPluginBinding"] = time.Now().String()

	return r.Patch(ctx, componentCopy, client.MergeFrom(component))
}

func (r *ComponentPluginBindingReconciler) UpdatePluginBinding(ctx context.Context, pluginBinding *corev1alpha1.ComponentPluginBinding, log logr.Logger) error {
	pluginProgram := componentPluginsCache.Get(pluginBinding.Spec.PluginName)

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

	return r.TouchComponents(ctx, pluginBinding, log)
}

func (r *ComponentPluginBindingReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.ComponentPluginBinding{}).
		Complete(r)
}
