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
	"crypto/md5"
	"fmt"
	"net"
	"strings"

	"github.com/miekg/dns"

	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
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

	//setup
	tenantName := r.Labels[TenantNameLabelKey]
	if tenantName == "" {
		return
	}

	domain := r.Spec.Domain

	if !IsValidNoneWildcardDomain(domain) &&
		!IsValidWildcardDomain(domain) {
		return
	}

	// special wildcard domain: * is not allowed here
	if domain == "*" {
		return
	}

	if IsRootDomain(domain) {
		r.Spec.DNSType = DNSTypeA
	} else {
		r.Spec.DNSType = DNSTypeCNAME
	}

	switch r.Spec.DNSType {
	case DNSTypeCNAME:
		kalmBaseDNSDomain := GetEnvKalmBaseDNSDomain()
		if kalmBaseDNSDomain == "" {
			domainlog.Info("kalm baseDNSDomain is empty")
			return
		}

		md5Domain := md5.Sum([]byte(domain))
		//<md5Domain>-<tenantName>
		cnamePrefix := fmt.Sprintf("%x-%s", md5Domain, tenantName)

		// <md5Domain-tenantName>-cname.<asia>.kalm-dns.com
		cname := fmt.Sprintf("%s-cname.%s", cnamePrefix, kalmBaseDNSDomain)
		r.Spec.DNSTarget = cname
	case DNSTypeA:
		clusterIP, _ := GetClusterIP()
		r.Spec.DNSTarget = clusterIP
	}
}

// todo special case like: stackoverflow.co.uk is not handled yet
func IsRootDomain(domain string) bool {
	parts := strings.Split(domain, ".")
	if IsValidNoneWildcardDomain(domain) && len(parts) == 2 {
		return true
	}

	return false
}

// from env or svc
func GetClusterIP() (string, error) {
	ip := GetEnvKalmClusterIP()
	if ip != "" {
		return ip, nil
	}

	svc := v1.Service{}
	objKey := types.NamespacedName{
		Name:      "istio-ingressgateway",
		Namespace: "istio-system",
	}

	err := webhookClient.Get(context.Background(), objKey, &svc)
	if err != nil {
		return "", err
	}

	ingress := svc.Status.LoadBalancer.Ingress
	if len(ingress) > 0 {
		return ingress[0].IP, nil
	}

	return "", nil
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

	if r.Spec.Domain == "" {
		rst = append(rst, KalmValidateError{
			Err:  "domain must not be empty",
			Path: "spec.domain",
		})
	}

	if r.Spec.DNSType != DNSTypeCNAME &&
		r.Spec.DNSType != DNSTypeA {
		rst = append(rst, KalmValidateError{
			Err:  "dnsType must either be CNAME or A",
			Path: "spec.dnsType",
		})
	}

	if r.Spec.DNSTarget == "" {
		rst = append(rst, KalmValidateError{
			Err:  "dnsTarget must not be empty",
			Path: "spec.dnsTarget",
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

	if oldDomain.Spec.DNSTarget != r.Spec.DNSTarget ||
		oldDomain.Spec.DNSType != r.Spec.DNSType ||
		oldDomain.Spec.Domain != r.Spec.Domain {
		return fmt.Errorf("domain is immutable, should not change it")
	}

	return nil
}

func (r *Domain) ValidateDelete() error {
	domainlog.Info("validate delete", "name", r.Name)
	return nil
}

func IsDomainConfiguredAsExpected(domainSpec DomainSpec) (bool, error) {
	domain := domainSpec.Domain

	expected := domainSpec.DNSTarget

	switch domainSpec.DNSType {
	case DNSTypeCNAME:
		directCNAME, err := getDirectCNAMEOfDomain(domain)
		if err != nil {
			domainlog.Info(fmt.Sprintf("fail when getDirectCNAMEOfDomain(%s)", domain), "err", err)

			if isNoSuchHostDNSError(err) {
				return false, nil
			}

			return false, err
		}

		isExpected := directCNAME == expected
		domainlog.Info(fmt.Sprintf("directCNAME(%t): %s -> %s, expected: %s", isExpected, domain, directCNAME, expected))

		return isExpected, nil
	case DNSTypeA:
		ips, err := net.LookupIP(domain)
		if err != nil {
			if isNoSuchHostDNSError(err) {
				domainlog.Error(err, fmt.Sprintf("no such host err lookupIP(%s)", domain))
				return false, nil
			}

			domainlog.Error(err, fmt.Sprintf("fail lookupIP(%s)", domain))
			return false, err
		}

		isExpected := false
		for _, ip := range ips {
			if ip.String() == expected {
				isExpected = true
				break
			}
		}

		domainlog.Info(fmt.Sprintf("lookupIP(%t): %s -> %s, expected: %s", isExpected, domain, ips, expected))
		return isExpected, nil
	default:
		domainlog.Info("unknown DNSType", "type:", domainSpec.DNSType)
		return false, nil
	}
}

func isNoSuchHostDNSError(err error) bool {
	if dnsErr, ok := err.(*net.DNSError); ok {
		if strings.Contains(dnsErr.Err, "no such host") {
			return true
		}
	}

	return false
}

func getDirectCNAMEOfDomain(domain string) (string, error) {
	// cname, _ := net.LookupCNAME(domain)
	// if cname != "" {
	// 	return cleanTailingDotInDomainIfExist(cname), nil
	// }

	c := new(dns.Client)
	m := new(dns.Msg)

	// Note the trailing dot. miekg/dns is very low-level and expects canonical names.
	if !strings.HasSuffix(domain, ".") {
		domain = domain + "."
	}

	m.SetQuestion(domain, dns.TypeCNAME)
	m.RecursionDesired = true

	// explicit use google DNS
	r, _, err := c.Exchange(m, "8.8.8.8:53")

	if err != nil {
		domainlog.Error(err, "fail when call dnsClient.Exchange")
		return "", err
	}

	if r == nil {
		domainlog.Info("dns.Msg returned by calling dnsClient.Exchange is nil")
		return "", nil
	} else if len(r.Answer) <= 0 {
		domainlog.Info("no Answer exist in dns.Msg returned by calling dnsClient.Exchange")
		return "", nil
	}

	target := r.Answer[0].(*dns.CNAME).Target
	return cleanTailingDotInDomainIfExist(target), nil
}

func cleanTailingDotInDomainIfExist(domain string) string {
	if strings.HasSuffix(domain, ".") {
		domain = domain[:len(domain)-1]
	}

	return domain
}
