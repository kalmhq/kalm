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
var httpscertlog = logf.Log.WithName("httpscert-resource")

func (r *HttpsCert) SetupWebhookWithManager(mgr ctrl.Manager) error {
	return ctrl.NewWebhookManagedBy(mgr).
		For(r).
		Complete()
}

// +kubebuilder:webhook:verbs=create;update,path=/validate-core-kalm-dev-v1alpha1-httpscert,mutating=false,failurePolicy=fail,groups=core.kalm.dev,resources=httpscerts,versions=v1alpha1,name=vhttpscert.kb.io

var _ webhook.Validator = &HttpsCert{}

// ValidateCreate implements webhook.Validator so a webhook will be registered for the type
func (r *HttpsCert) ValidateCreate() error {
	httpscertlog.Info("validate create", "name", r.Name)
	return r.validate()
}

// ValidateUpdate implements webhook.Validator so a webhook will be registered for the type
func (r *HttpsCert) ValidateUpdate(old runtime.Object) error {
	httpscertlog.Info("validate update", "name", r.Name)
	return r.validate()
}

// ValidateDelete implements webhook.Validator so a webhook will be registered for the type
func (r *HttpsCert) ValidateDelete() error {
	httpscertlog.Info("validate delete", "name", r.Name)
	return nil
}

func (r *HttpsCert) validate() error {
	var rst KalmValidateErrorList

	for i, domain := range r.Spec.Domains {
		if isValidDomain(domain) {
			continue
		}

		rst = append(rst, KalmValidateError{
			Err:  "invalid domain:" + domain,
			Path: fmt.Sprintf("spec.domains[%d]", i),
		})

	}

	if r.Spec.IsSelfManaged {
		if r.Spec.SelfManagedCertSecretName == "" {
			rst = append(rst, KalmValidateError{
				Err:  "need secretName for selfManaged cert",
				Path: "spec.selfManagedCertSecretName",
			})
		}
	} else {
		if r.Spec.HttpsCertIssuer == "" {
			rst = append(rst, KalmValidateError{
				Err:  "need httpsCertIssuer",
				Path: "spec.httpsCertIssuer",
			})
		}
	}

	if len(rst) == 0 {
		return nil
	}

	return rst
}
