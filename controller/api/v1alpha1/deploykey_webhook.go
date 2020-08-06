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
	"fmt"
	apimachineryvalidation "k8s.io/apimachinery/pkg/api/validation"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/util/validation"
	ctrl "sigs.k8s.io/controller-runtime"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/webhook"
	"strings"
)

// log is for logging in this package.
var deploykeylog = logf.Log.WithName("deploykey-resource")

func (r *DeployKey) SetupWebhookWithManager(mgr ctrl.Manager) error {
	return ctrl.NewWebhookManagedBy(mgr).
		For(r).
		Complete()
}

// +kubebuilder:webhook:path=/mutate-core-kalm-dev-v1alpha1-deploykey,mutating=true,failurePolicy=fail,groups=core.kalm.dev,resources=deploykeys,verbs=create;update,versions=v1alpha1,name=mdeploykey.kb.io

var _ webhook.Defaulter = &DeployKey{}

// Default implements webhook.Defaulter so a webhook will be registered for the type
func (r *DeployKey) Default() {
	deploykeylog.Info("default", "name", r.Name)
}

// +kubebuilder:webhook:verbs=create;update,path=/validate-core-kalm-dev-v1alpha1-deploykey,mutating=false,failurePolicy=fail,groups=core.kalm.dev,resources=deploykeys,versions=v1alpha1,name=vdeploykey.kb.io

var _ webhook.Validator = &DeployKey{}

// ValidateCreate implements webhook.Validator so a webhook will be registered for the type
func (r *DeployKey) ValidateCreate() error {
	deploykeylog.Info("validate create", "name", r.Name)

	return r.validate()
}

// ValidateUpdate implements webhook.Validator so a webhook will be registered for the type
func (r *DeployKey) ValidateUpdate(old runtime.Object) error {
	deploykeylog.Info("validate update", "name", r.Name)

	return r.validate()
}

// ValidateDelete implements webhook.Validator so a webhook will be registered for the type
func (r *DeployKey) ValidateDelete() error {
	deploykeylog.Info("validate delete", "name", r.Name)
	return nil
}

func (r *DeployKey) validate() (rst KalmValidateErrorList) {
	switch r.Spec.Scope {
	case DeployKeyTypeComponent:
		if len(r.Spec.Resources) == 0 {
			rst = append(rst, KalmValidateError{
				Err:  fmt.Sprintf("at lease 1 namespace/component for DeloyKey with scope: %s", r.Spec.Scope),
				Path: "spec.resources",
			})
		}

		for i, res := range r.Spec.Resources {
			pair := strings.Split(res, "/")
			if len(pair) != 2 {
				rst = append(rst, KalmValidateError{
					Err:  fmt.Sprintf("invalid namespace/component: %s", res),
					Path: fmt.Sprintf("spec.resources[%d]", i),
				})
			}

			ns := pair[0]
			errs := apimachineryvalidation.ValidateNamespaceName(ns, false)
			if len(errs) != 0 {
				rst = append(rst, KalmValidateError{
					Err:  fmt.Sprintf("invalid namespace: %s", ns),
					Path: fmt.Sprintf("spec.resources[%d]", i),
				})
			}

			component := pair[1]
			errs = validation.IsDNS1035Label(component)
			if len(errs) != 0 {
				rst = append(rst, KalmValidateError{
					Err:  fmt.Sprintf("invalid component name: %s", component),
					Path: fmt.Sprintf("spec.resources[%d]", i),
				})
			}
		}
	case DeployKeyTypeNamespace:
		if len(r.Spec.Resources) == 0 {
			rst = append(rst, KalmValidateError{
				Err:  fmt.Sprintf("at lease 1 namespace for DeloyKey with scope: %s", r.Spec.Scope),
				Path: "spec.resources",
			})
		}

		for i, res := range r.Spec.Resources {
			errs := apimachineryvalidation.ValidateNamespaceName(res, false)
			if len(errs) != 0 {
				rst = append(rst, KalmValidateError{
					Err:  fmt.Sprintf("invalid namespace: %s", res),
					Path: fmt.Sprintf("spec.resources[%d]", i),
				})
			}
		}
	case DeployKeyTypeCluster:
		// ignore
	default:
		rst = append(rst, KalmValidateError{
			Err:  fmt.Sprintf("unknown scope: %s", r.Spec.Scope),
			Path: "spec.scope",
		})
	}

	return rst
}
