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
	"github.com/xeipuuv/gojsonschema"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	corev1alpha1 "github.com/kapp-staging/kapp/controller/api/v1alpha1"
)

// ApplicationPluginBindingReconciler reconciles a ApplicationPluginBinding object
type ApplicationPluginBindingReconciler struct {
	*BaseReconciler
}

// +kubebuilder:rbac:groups=core.kapp.dev,resources=applicationpluginbindings,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=applicationpluginbindings/status,verbs=get;update;patch

func (r *ApplicationPluginBindingReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	task := &ApplicationPluginBindingReconcilerTask{
		ApplicationPluginBindingReconciler: r,
		ctx:                                context.Background(),
	}

	return ctrl.Result{}, task.Run(req)
}

type ApplicationPluginBindingReconcilerTask struct {
	*ApplicationPluginBindingReconciler
	ctx     context.Context
	binding *corev1alpha1.ApplicationPluginBinding
}

func (r *ApplicationPluginBindingReconcilerTask) UpdatePluginBindingStatus() error {
	pluginProgram := applicationPluginsCache.Get(r.binding.Spec.PluginName)

	if pluginProgram == nil {
		return nil
	}

	isConfigValid := true
	var configError string

	if pluginProgram.ConfigSchema != nil {
		if r.binding.Spec.Config == nil {
			isConfigValid = false
			configError = "Configuration is required."
		} else {
			pluginConfig := gojsonschema.NewStringLoader(string(r.binding.Spec.Config.Raw))
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

	pluginBindingCopy := r.binding.DeepCopy()
	pluginBindingCopy.Status.ConfigError = configError
	pluginBindingCopy.Status.ConfigValid = isConfigValid

	if err := r.Status().Patch(r.ctx, pluginBindingCopy, client.MergeFrom(r.binding)); err != nil {
		r.WarningEvent(err, "Patch plugin binding status error.")
		return err
	}

	return nil
}

func (r *ApplicationPluginBindingReconcilerTask) Run(req ctrl.Request) error {
	var pluginBinding corev1alpha1.ApplicationPluginBinding

	if err := r.Get(r.ctx, req.NamespacedName, &pluginBinding); err != nil {
		return client.IgnoreNotFound(err)
	}

	r.binding = &pluginBinding

	if r.binding.ObjectMeta.Labels == nil {
		r.binding.ObjectMeta.Labels = make(map[string]string)
	}

	r.binding.ObjectMeta.Labels["kapp-plugin"] = r.binding.Spec.PluginName

	if err := r.Update(r.ctx, r.binding); err != nil {
		r.WarningEvent(err, "update plugin binding error.")
		return err
	}

	return r.UpdatePluginBindingStatus()
}

func (r *ApplicationPluginBindingReconcilerTask) WarningEvent(err error, msg string, args ...interface{}) {
	r.EmitWarningEvent(r.binding, err, msg, args...)
}

func (r *ApplicationPluginBindingReconcilerTask) NormalEvent(reason, msg string, args ...interface{}) {
	r.EmitNormalEvent(r.binding, reason, msg, args...)
}

func NewApplicationPluginBindingReconciler(mgr ctrl.Manager) *ApplicationPluginBindingReconciler {
	return &ApplicationPluginBindingReconciler{
		NewBaseReconciler(mgr, "ApplicationPluginBinding"),
	}
}

func (r *ApplicationPluginBindingReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.ApplicationPluginBinding{}).
		Complete(r)
}
