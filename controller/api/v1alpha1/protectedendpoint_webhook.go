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

	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/webhook"
)

// log is for logging in this package.
var protectedendpointlog = logf.Log.WithName("protectedendpoint-resource")

func (r *ProtectedEndpoint) SetupWebhookWithManager(mgr ctrl.Manager) error {
	return ctrl.NewWebhookManagedBy(mgr).
		For(r).
		Complete()
}

// +kubebuilder:webhook:verbs=create;update,path=/mutate-core-v1alpha1-protectedendpoint,mutating=true,failurePolicy=fail,groups=core,resources=protectedendpointtypes,versions=v1alpha1,name=mprotectedendpointtype.kb.io

var _ webhook.Defaulter = &ProtectedEndpoint{}

func (r *ProtectedEndpoint) Default() {
	protectedendpointlog.Info("default", "name", r.Name)
}

// +kubebuilder:webhook:verbs=create;update,path=/validate-core-v1alpha1-protectedendpoint,mutating=false,failurePolicy=fail,groups=core,resources=protectedendpointtypes,versions=v1alpha1,name=vprotectedendpointtype.kb.io

var _ webhook.Validator = &ProtectedEndpoint{}

// ValidateCreate implements webhook.Validator so a webhook will be registered for the type
func (r *ProtectedEndpoint) ValidateCreate() error {
	protectedendpointlog.Info("validate create", "name", r.Name)

	return r.validate()
}

// ValidateUpdate implements webhook.Validator so a webhook will be registered for the type
func (r *ProtectedEndpoint) ValidateUpdate(old runtime.Object) error {
	protectedendpointlog.Info("validate update", "name", r.Name)

	return r.validate()
}

// ValidateDelete implements webhook.Validator so a webhook will be registered for the type
func (r *ProtectedEndpoint) ValidateDelete() error {
	protectedendpointlog.Info("validate delete", "name", r.Name)
	return nil
}

func (r *ProtectedEndpoint) validate() error {
	var rst KalmValidateErrorList

	if !isValidLabelValue(r.Spec.EndpointName) {
		rst = append(rst, KalmValidateError{
			Err:  "invalid endpointName",
			Path: "spec.endpointName",
		})
	}

	for i, port := range r.Spec.Ports {
		if port == 0 {
			rst = append(rst, KalmValidateError{
				Err:  "port should not be 0",
				Path: fmt.Sprintf("spec.ports[%d]", i),
			})
		}
	}

	if len(rst) == 0 {
		return nil
	}

	return rst
}
