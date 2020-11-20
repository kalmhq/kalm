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
	"context"
	"fmt"
	"strings"

	admissionv1beta1 "k8s.io/api/admission/v1beta1"
	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/webhook"
)

// log is for logging in this package.
var httpscertlog = logf.Log.WithName("httpscert-resource")

var validIssuers = []string{
	DefaultDNS01IssuerName,
	DefaultHTTP01IssuerName,
	DefaultCAIssuerName,
}

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

	tenantName := r.Labels[TenantNameLabelKey]
	if tenantName == "" {
		// todo, what's the tenant for system cert?
		httpscertlog.Info("see httpsCert without tenant", "name", r.Name)
		return nil
	}

	//todo how to tell if this is dryRun?
	reqInfo := NewAdmissionRequestInfo(r, admissionv1beta1.Create, false)
	if err := CheckAndUpdateTenant(tenantName, reqInfo, 3); err != nil {
		httproutelog.Error(err, "fail when try to allocate resource", "ns/name", getKey(r))
		return err
	}

	return nil
}

// ValidateUpdate implements webhook.Validator so a webhook will be registered for the type
func (r *HttpsCert) ValidateUpdate(old runtime.Object) error {
	httpscertlog.Info("validate update", "name", r.Name)

	// if !HasTenantSet(r) {
	// 	return NoTenantFoundError
	// }

	// if IsTenantChanged(r, old) {
	// 	return TenantChangedError
	// }

	return r.validate()
}

// ValidateDelete implements webhook.Validator so a webhook will be registered for the type
func (r *HttpsCert) ValidateDelete() error {
	httpscertlog.Info("validate delete", "name", r.Name)

	tenantName := r.Labels[TenantNameLabelKey]
	if tenantName == "" {
		return nil
	}

	reqInfo := NewAdmissionRequestInfo(r, admissionv1beta1.Delete, false)
	if err := CheckAndUpdateTenant(tenantName, reqInfo, 3); err != nil {
		httproutelog.Error(err, "fail when try to update resource, ignored", "ns/name", getKey(r))
		return err
	}

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

var _ TenantEvaluator = &httpsCertEvaluator{}

type httpsCertEvaluator struct {
}

func (e httpsCertEvaluator) Usage(reqInfo AdmissionRequestInfo) (ResourceList, error) {
	tenantName, err := GetTenantNameFromObj(reqInfo.Obj)
	if err != nil {
		return nil, NoTenantFoundError
	}

	var certList HttpsCertList
	if err := webhookClient.List(context.Background(), &certList, client.MatchingLabels{TenantNameLabelKey: tenantName}); err != nil {
		return nil, err
	}

	isDelete := reqInfo.Operation == admissionv1beta1.Delete
	cnt := reCountResource(reqInfo.Obj, httpsCertsToObjList(certList.Items), isDelete)

	quantity := resource.NewQuantity(int64(cnt), resource.DecimalSI)
	rst := map[ResourceName]resource.Quantity{
		ResourceHttpsCertsCount: *quantity,
	}

	return rst, nil
}

func httpsCertsToObjList(items []HttpsCert) []runtime.Object {
	var rst []runtime.Object
	for i := range items {
		item := items[i]
		rst = append(rst, &item)
	}
	return rst
}
