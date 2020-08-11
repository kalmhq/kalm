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
var httpscertissuerlog = logf.Log.WithName("httpscertissuer-resource")

func (r *HttpsCertIssuer) SetupWebhookWithManager(mgr ctrl.Manager) error {
	return ctrl.NewWebhookManagedBy(mgr).
		For(r).
		Complete()
}

// +kubebuilder:webhook:verbs=create;update,path=/validate-core-kalm-dev-v1alpha1-httpscertissuer,mutating=false,failurePolicy=fail,groups=core.kalm.dev,resources=httpscertissuers,versions=v1alpha1,name=vhttpscertissuer.kb.io

var _ webhook.Validator = &HttpsCertIssuer{}

// ValidateCreate implements webhook.Validator so a webhook will be registered for the type
func (r *HttpsCertIssuer) ValidateCreate() error {
	httpscertissuerlog.Info("validate create", "name", r.Name)
	return r.validate()
}

// ValidateUpdate implements webhook.Validator so a webhook will be registered for the type
func (r *HttpsCertIssuer) ValidateUpdate(old runtime.Object) error {
	httpscertissuerlog.Info("validate update", "name", r.Name)
	return r.validate()
}

// ValidateDelete implements webhook.Validator so a webhook will be registered for the type
func (r *HttpsCertIssuer) ValidateDelete() error {
	httpscertissuerlog.Info("validate delete", "name", r.Name)
	return nil
}

func (r *HttpsCertIssuer) validate() error {
	var rst KalmValidateErrorList

	if r.Spec.ACMECloudFlare == nil &&
		r.Spec.CAForTest == nil &&
		r.Spec.HTTP01 == nil {

		rst = append(rst, KalmValidateError{
			Err:  "should provide at least 1 among: acmeCloudFlare, caForTest and http01",
			Path: "spec",
		})
	}

	http01 := r.Spec.HTTP01
	if http01 != nil && http01.Email != "" {
		if !isValidEmail(http01.Email) {
			rst = append(rst, KalmValidateError{
				Err:  "invalid email:" + http01.Email,
				Path: "spec.http01.email",
			})
		}
	}

	acmeCloudFlare := r.Spec.ACMECloudFlare
	if acmeCloudFlare != nil {
		if !isValidResourceName(acmeCloudFlare.APITokenSecretName) {
			rst = append(rst, KalmValidateError{
				Err:  "invalid secret name",
				Path: "spec.acmeCloudFlare.apiTokenSecretName",
			})
		}

		if !isValidEmail(acmeCloudFlare.Email) {
			rst = append(rst, KalmValidateError{
				Err:  "invalid email:" + acmeCloudFlare.Email,
				Path: "spec.acmeCloudFlare.email",
			})
		}
	}

	if len(rst) == 0 {
		return nil
	}

	return rst
}
