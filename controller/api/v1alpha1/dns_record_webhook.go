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

var dnsrecordlog = logf.Log.WithName("dnsrecord-resource")

func (r *DnsRecord) SetupWebhookWithManager(mgr ctrl.Manager) error {
	return ctrl.NewWebhookManagedBy(mgr).
		For(r).
		Complete()
}

var _ webhook.Defaulter = &DnsRecord{}

func (r *DnsRecord) Default() {
	accesstokenlog.Info("default", "name", r.Name)
}

var _ webhook.Validator = &DnsRecord{}

func (r *DnsRecord) ValidateCreate() error {
	return nil
}

// ValidateUpdate implements webhook.Validator so a webhook will be registered for the type
func (r *DnsRecord) ValidateUpdate(old runtime.Object) error {
	return nil
}

func (r *DnsRecord) ValidateDelete() error {
	return nil
}

func (r *DnsRecord) validate() error {
	return nil
}
