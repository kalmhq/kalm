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
	"strings"

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

// +kubebuilder:webhook:path=/mutate-core-kalm-dev-v1alpha1-httpscert,mutating=true,failurePolicy=fail,groups=core.kalm.dev,resources=httpscerts,verbs=create;update,versions=v1alpha1,name=mhttpscert.kb.io

var _ webhook.Defaulter = &HttpsCert{}

// Default implements webhook.Defaulter so a webhook will be registered for the type
// spec.domains
//  1. trim space
//  2. rm duplicates
func (r *HttpsCert) Default() {
	var processedDomains []string

	uniqDomainMap := make(map[string]interface{})
	for _, domain := range r.Spec.Domains {
		domain = strings.TrimSpace(domain)
		if len(domain) <= 0 {
			continue
		}

		uniqDomainMap[domain] = true
	}

	for domain := range uniqDomainMap {
		processedDomains = append(processedDomains, domain)
	}

	r.Spec.Domains = processedDomains
}

// +kubebuilder:webhook:verbs=create;update;delete,path=/validate-core-kalm-dev-v1alpha1-httpscert,mutating=false,failurePolicy=fail,groups=core.kalm.dev,resources=httpscerts,versions=v1alpha1,name=vhttpscert.kb.io

var _ webhook.Validator = &HttpsCert{}

// ValidateCreate implements webhook.Validator so a webhook will be registered for the type
func (r *HttpsCert) ValidateCreate() error {
	httpscertlog.Info("validate create", "name", r.Name)

	if err := r.validate(); err != nil {
		return err
	}

	return nil
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
		if isValidDomainInCert(domain) {
			continue
		}

		if domain == "*" {
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
		switch r.Spec.HttpsCertIssuer {
		case DefaultHTTP01IssuerName:
			if len(r.Spec.Domains) <= 0 {
				rst = append(rst, KalmValidateError{
					Err:  "http01 cert should have at lease 1 domain",
					Path: "spec.domains",
				})
			}

			for _, d := range r.Spec.Domains {
				if strings.Contains(d, "*") {
					rst = append(rst, KalmValidateError{
						Err:  fmt.Sprintf("http01 cert should not have '*' in domain: %s", d),
						Path: "spec.domains",
					})
				}
			}
		case DefaultDNS01IssuerName:
			//nothing
		case DefaultCAIssuerName:
			//nothing
		default:

			validIssuers := []string{
				DefaultDNS01IssuerName,
				DefaultHTTP01IssuerName,
				DefaultCAIssuerName,
			}

			rst = append(rst, KalmValidateError{
				Err: fmt.Sprintf("for auto managed cert, httpsCertIssuer should be one of: %s, but: %s",
					validIssuers, r.Spec.HttpsCertIssuer),
				Path: "spec.httpsCertIssuer",
			})
		}
	}

	if len(rst) == 0 {
		return nil
	}

	return rst
}
