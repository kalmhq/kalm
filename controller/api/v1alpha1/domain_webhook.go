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
	"os"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/webhook"
)

var domainlog = logf.Log.WithName("domain-resource")
var webhookClient client.Client

func (r *Domain) SetupWebhookWithManager(mgr ctrl.Manager) error {
	webhookClient = mgr.GetClient()
	return ctrl.NewWebhookManagedBy(mgr).
		For(r).
		Complete()
}

// +kubebuilder:webhook:path=/mutate-core-kalm-dev-v1alpha1-domain,mutating=true,failurePolicy=fail,groups=core.kalm.dev,resources=domains,verbs=create;update,versions=v1alpha1,name=mdomain.kb.io

var _ webhook.Defaulter = &Domain{}

func (r *Domain) Default() {
	domainlog.Info("default", "name", r.Name)

	clusterIP, hostname, err := GetClusterIPOrHostname()
	if err != nil {
		return
	}

	if clusterIP == "" && hostname == "" {
		isLocalMode := os.Getenv("KALM_MODE") == "local"
		if isLocalMode {
			r.Spec.DNSType = DNSTypeKalmSimpleRecord
		}
	} else if hostname != "" {
		r.Spec.DNSType = DNSTypeCNAME
		r.Spec.DNSTarget = hostname
	} else if clusterIP != "" {
		r.Spec.DNSType = DNSTypeA
		r.Spec.DNSTarget = clusterIP
	}
}

// +kubebuilder:webhook:verbs=create;update,path=/validate-core-kalm-dev-v1alpha1-domain,mutating=false,failurePolicy=fail,groups=core.kalm.dev,resources=domains,versions=v1alpha1,name=vdomain.kb.io

var _ webhook.Validator = &Domain{}

func (r *Domain) ValidateCreate() error {
	domainlog.Info("validate create", "name", r.Name)
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

	// skip check if Domain type is KalmSimpleRecord
	if r.Spec.DNSType == DNSTypeKalmSimpleRecord {
		return nil
	}

	if !isValidDomainInCert(r.Spec.Domain) {
		rst = append(rst, KalmValidateError{
			Err:  "domain is not valid",
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

	if oldDomain.Spec.Domain != r.Spec.Domain {
		return fmt.Errorf("domain is immutable, should not change it, old: %+v, new: %+v", oldDomain, r)
	}

	return nil
}

func (r *Domain) ValidateDelete() error {
	domainlog.Info("validate delete", "name", r.Name)
	return nil
}

func GetClusterIPOrHostname() (string, string, error) {
	ip := GetEnvKalmClusterIP()

	if ip != "" {
		return ip, "", nil
	}

	svc := corev1.Service{}
	objKey := types.NamespacedName{
		Name:      "istio-ingressgateway",
		Namespace: "istio-system",
	}

	err := webhookClient.Get(context.Background(), objKey, &svc)
	if err != nil {
		return "", "", err
	}

	ingress := svc.Status.LoadBalancer.Ingress
	if len(ingress) > 0 {
		return ingress[0].IP, ingress[0].Hostname, nil
	}

	return "", "", nil
}
