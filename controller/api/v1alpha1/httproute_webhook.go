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
	"strconv"
	"strings"

	"github.com/kalmhq/kalm/controller/validation"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/webhook"
)

// log is for logging in this package.
var httproutelog = logf.Log.WithName("httproute-resource")

func (r *HttpRoute) SetupWebhookWithManager(mgr ctrl.Manager) error {
	return ctrl.NewWebhookManagedBy(mgr).
		For(r).
		Complete()
}

// +kubebuilder:webhook:path=/mutate-core-kalm-dev-v1alpha1-httproute,mutating=true,failurePolicy=fail,groups=core.kalm.dev,resources=httproutes,verbs=create;update,versions=v1alpha1,name=mhttproute.kb.io

var _ webhook.Defaulter = &HttpRoute{}

// Default implements webhook.Defaulter so a webhook will be registered for the type
func (r *HttpRoute) Default() {
	httproutelog.Info("default", "name", r.Name)
}

// +kubebuilder:webhook:verbs=create;update;delete,path=/validate-core-kalm-dev-v1alpha1-httproute,mutating=false,failurePolicy=fail,groups=core.kalm.dev,resources=httproutes,versions=v1alpha1,name=vhttproute.kb.io

var _ webhook.Validator = &HttpRoute{}

// ValidateCreate implements webhook.Validator so a webhook will be registered for the type
func (r *HttpRoute) ValidateCreate() error {
	httproutelog.Info("validate create", "name", r.Name)

	if err := r.validate(); err != nil {
		return err
	}

	return nil
}

// ValidateUpdate implements webhook.Validator so a webhook will be registered for the type
func (r *HttpRoute) ValidateUpdate(old runtime.Object) error {
	httproutelog.Info("validate update", "name", r.Name)

	return r.validate()
}

// ValidateDelete implements webhook.Validator so a webhook will be registered for the type
func (r *HttpRoute) ValidateDelete() error {
	httproutelog.Info("validate delete", "name", r.Name)
	return nil
}

func (r *HttpRoute) validate() error {
	var rst KalmValidateErrorList

	for i, host := range r.Spec.Hosts {
		if !isValidRouteHost(host) {
			rst = append(rst, KalmValidateError{
				Err:  "invalid route host:" + host,
				Path: fmt.Sprintf("spec.hosts[%d]", i),
			})
		}
	}

	for i, path := range r.Spec.Paths {
		if !isValidPath(path) {
			rst = append(rst, KalmValidateError{
				Err:  "invalid path, should start with: /",
				Path: fmt.Sprintf("spec.paths[%d]", i),
			})
		}
	}

	for i, dest := range r.Spec.Destinations {
		if !isValidDestinationHost(dest.Host) {
			rst = append(rst, KalmValidateError{
				Err:  "invalid destination host:" + dest.Host,
				Path: fmt.Sprintf("spec.destinations[%d].host", i),
			})
		}
	}

	timeout := r.Spec.Timeout
	if timeout != nil {
		if *timeout <= 0 {
			rst = append(rst, KalmValidateError{
				Err:  "should be positive",
				Path: "spec.timeout",
			})
		}
	}

	mirror := r.Spec.Mirror
	if mirror != nil {
		mirrorDestinationHost := mirror.Destination.Host
		if !isValidDestinationHost(mirrorDestinationHost) {
			rst = append(rst, KalmValidateError{
				Err:  "invalid mirror destination host:" + mirrorDestinationHost,
				Path: "spec.mirror.destination.host",
			})
		}
	}

	if len(rst) == 0 {
		return nil
	}

	return rst
}

func getValidSuffixOfAppDomain(tenantName, baseAppDomain string) string {
	validSuffix := fmt.Sprintf("%s.%s", tenantName, baseAppDomain)
	return validSuffix
}

func isValidDestinationHost(host string) bool {
	host = stripIfHasPort(host)
	return validation.ValidateFQDN(host) == nil
}

func isValidRouteHost(host string) bool {
	return validation.ValidateWildcardDomain(host) == nil || validation.ValidateIPAddress(host) == nil
}

func stripIfHasPort(host string) string {
	parts := strings.Split(host, ":")
	if len(parts) == 2 {
		portStr := parts[1]
		port, err := strconv.Atoi(portStr)

		if err == nil && port > 0 && port <= 65535 {
			host = parts[0]
		}
	}

	return host
}
