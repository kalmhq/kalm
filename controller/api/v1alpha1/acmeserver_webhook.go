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
	"github.com/kalmhq/kalm/controller/validation"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/webhook"
)

// log is for logging in this package.
var acmeserverlog = logf.Log.WithName("acmeserver-resource")

func (r *ACMEServer) SetupWebhookWithManager(mgr ctrl.Manager) error {
	return ctrl.NewWebhookManagedBy(mgr).
		For(r).
		Complete()
}

// +kubebuilder:webhook:verbs=create;update,path=/validate-core-kalm-dev-v1alpha1-acmeserver,mutating=false,failurePolicy=fail,groups=core.kalm.dev,resources=acmeservers,versions=v1alpha1,name=vacmeserver.kb.io

var _ webhook.Validator = &ACMEServer{}

// ValidateCreate implements webhook.Validator so a webhook will be registered for the type
func (r *ACMEServer) ValidateCreate() error {
	acmeserverlog.Info("validate create", "name", r.Name)

	return r.validate()
}

// ValidateUpdate implements webhook.Validator so a webhook will be registered for the type
func (r *ACMEServer) ValidateUpdate(old runtime.Object) error {
	acmeserverlog.Info("validate update", "name", r.Name)

	return r.validate()
}

// ValidateDelete implements webhook.Validator so a webhook will be registered for the type
func (r *ACMEServer) ValidateDelete() error {
	acmeserverlog.Info("validate delete", "name", r.Name)
	return nil
}

func (r *ACMEServer) validate() error {
	var rst KalmValidateErrorList
	if r.Spec.ACMEDomain == "" {
		rst = append(rst, KalmValidateError{
			Err:  "should not be empty",
			Path: "spec.acmeDomain",
		})
	}

	if validation.ValidateFQDN(r.Spec.ACMEDomain) != nil {
		rst = append(rst, KalmValidateError{
			Err:  "is not valid domain:" + r.Spec.ACMEDomain,
			Path: "spec.acmeDomain",
		})
	}

	if r.Spec.NSDomain == "" {
		rst = append(rst, KalmValidateError{
			Err:  "should not be empty",
			Path: "spec.nsDomain",
		})
	}

	if validation.ValidateFQDN(r.Spec.NSDomain) != nil {
		rst = append(rst, KalmValidateError{
			Err:  "is not valid domain:" + r.Spec.NSDomain,
			Path: "spec.nsDomain",
		})
	}

	if len(rst) == 0 {
		return nil
	}

	return rst
}
