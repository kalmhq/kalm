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
	"crypto/md5"
	"fmt"
	"strings"

	"github.com/miekg/dns"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/webhook"
)

var domainlog = logf.Log.WithName("domain-resource")

func (r *Domain) SetupWebhookWithManager(mgr ctrl.Manager) error {
	return ctrl.NewWebhookManagedBy(mgr).
		For(r).
		Complete()
}

// +kubebuilder:webhook:path=/mutate-core-kalm-dev-v1alpha1-domain,mutating=true,failurePolicy=fail,groups=core.kalm.dev,resources=domains,verbs=create;update,versions=v1alpha1,name=mdomain.kb.io

var _ webhook.Defaulter = &Domain{}

func (r *Domain) Default() {
	domainlog.Info("default", "name", r.Name)

	//setup cname
	tenantName := r.Labels[TenantNameLabelKey]
	if tenantName == "" {
		return
	}

	kalmBaseDNSDomain := GetEnvKalmBaseDNSDomain()
	if kalmBaseDNSDomain == "" {
		domainlog.Info("kalm baseDNSDomain is empty")
		return
	}

	md5Domain := md5.Sum([]byte(r.Spec.Domain))
	//<md5Domain>-<tenantName>
	cnamePrefix := fmt.Sprintf("%x-%s", md5Domain, tenantName)

	// <md5Domain-tenantName>-cname.<asia>.kalm-dns.com
	cname := fmt.Sprintf("%s-cname.%s", cnamePrefix, kalmBaseDNSDomain)
	r.Spec.CNAME = cname
}

// +kubebuilder:webhook:verbs=create;update,path=/validate-core-kalm-dev-v1alpha1-domain,mutating=false,failurePolicy=fail,groups=core.kalm.dev,resources=domains,versions=v1alpha1,name=vdomain.kb.io

var _ webhook.Validator = &Domain{}

func (r *Domain) ValidateCreate() error {
	domainlog.Info("validate create", "name", r.Name)

	tenantName := r.Labels[TenantNameLabelKey]
	if tenantName == "" {
		return NoTenantLabelSetError
	}

	return r.validate()
}

//todo more strict check
//- check if domain & cname is unique
//- check if format of domain & cname are valid
func (r *Domain) validate() error {
	var rst KalmValidateErrorList

	if r.Spec.CNAME == "" {
		rst = append(rst, KalmValidateError{
			Err:  "cname must not be empty",
			Path: "spec.cname",
		})
	}

	if r.Spec.Domain == "" {
		rst = append(rst, KalmValidateError{
			Err:  "domain must not be empty",
			Path: "spec.domain",
		})
	}

	if len(rst) == 0 {
		return nil
	}

	return rst
}

//disable update cuz domain name is auto generated from spec.domain
func (r *Domain) ValidateUpdate(old runtime.Object) error {
	domainlog.Info("validate update", "name", r.Name)

	oldDomain, ok := old.(*Domain)
	if !ok {
		return fmt.Errorf("old is not *Domain, %+v", old)
	}

	if oldDomain.Spec.CNAME != r.Spec.CNAME ||
		oldDomain.Spec.Domain != r.Spec.Domain {
		return fmt.Errorf("domain is immutable, should not change it")
	}

	return nil
}

func (r *Domain) ValidateDelete() error {
	domainlog.Info("validate delete", "name", r.Name)
	return nil
}

func IsCNAMEConfiguredAsExpected(domain, expectedCNAME string) bool {
	directCNAME := getDirectCNAMEOfDomain(domain)

	isExpected := directCNAME == expectedCNAME
	domainlog.Info(fmt.Sprintf("directCNAME(%t): %s -> %s, expected: %s", isExpected, domain, directCNAME, expectedCNAME))

	return isExpected
}

// https://stackoverflow.com/a/56856437/404145
func getDirectCNAMEOfDomain(domain string) string {
	// config, _ := dns.ClientConfigFromFile("/etc/resolv.conf")
	c := new(dns.Client)
	m := new(dns.Msg)

	// Note the trailing dot. miekg/dns is very low-level and expects canonical names.
	if !strings.HasSuffix(domain, ".") {
		domain = domain + "."
	}

	m.SetQuestion(domain, dns.TypeCNAME)
	m.RecursionDesired = true

	// r, _, err := c.Exchange(m, config.Servers[0]+":"+config.Port)
	r, _, err := c.Exchange(m, "8.8.8.8:53")

	if err != nil {
		domainlog.Error(err, "fail when call dnsClient.Exchange")
		return ""
	}

	if r == nil {
		domainlog.Info("dns.Msg returned by calling dnsClient.Exchange is nil")
		return ""
	} else if len(r.Answer) <= 0 {
		domainlog.Info("no Answer exist in dns.Msg returned by calling dnsClient.Exchange")
		return ""
	}

	target := r.Answer[0].(*dns.CNAME).Target
	if strings.HasSuffix(target, ".") {
		target = target[:len(target)-1]
	}

	return target
}
