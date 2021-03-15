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

package v1alpha1

import (
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/webhook"
)

// log is for logging in this package.
var componentpluginbindinglog = logf.Log.WithName("componentpluginbinding-resource")

func (r *ComponentPluginBinding) SetupWebhookWithManager(mgr ctrl.Manager) error {
	return ctrl.NewWebhookManagedBy(mgr).
		For(r).
		Complete()
}

// +kubebuilder:webhook:path=/mutate-core-kalm-dev-v1alpha1-componentpluginbinding,mutating=true,failurePolicy=fail,groups=core.kalm.dev,resources=componentpluginbindings,verbs=create;update,versions=v1alpha1,name=mcomponentpluginbinding.kb.io

var _ webhook.Defaulter = &ComponentPluginBinding{}

func (r *ComponentPluginBinding) Default() {
	componentpluginbindinglog.Info("default", "name", r.Name)
}

// +kubebuilder:webhook:verbs=create;update,path=/validate-core-kalm-dev-v1alpha1-componentpluginbinding,mutating=false,failurePolicy=fail,groups=core.kalm.dev,resources=componentpluginbindings,versions=v1alpha1,name=vcomponentpluginbinding.kb.io

var _ webhook.Validator = &ComponentPluginBinding{}

// ValidateCreate implements webhook.Validator so a webhook will be registered for the type
func (r *ComponentPluginBinding) ValidateCreate() error {
	componentpluginbindinglog.Info("validate create", "name", r.Name)

	return r.validate()
}

// ValidateUpdate implements webhook.Validator so a webhook will be registered for the type
func (r *ComponentPluginBinding) ValidateUpdate(old runtime.Object) error {
	componentpluginbindinglog.Info("validate update", "name", r.Name)

	return r.validate()
}

// ValidateDelete implements webhook.Validator so a webhook will be registered for the type
func (r *ComponentPluginBinding) ValidateDelete() error {
	componentpluginbindinglog.Info("validate delete", "name", r.Name)
	return nil
}

func (r *ComponentPluginBinding) validate() error {
	var rst KalmValidateErrorList

	if r.Spec.ComponentName != "" {
		isValid := isValidResourceName(r.Spec.ComponentName)
		if !isValid {
			rst = append(rst, KalmValidateError{
				Err:  "invalid componentName",
				Path: "spec.componentName",
			})
		}
	}

	if len(rst) == 0 {
		return nil
	}

	return rst
}
