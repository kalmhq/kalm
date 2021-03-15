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
var dockerregistrylog = logf.Log.WithName("dockerregistry-resource")

func (r *DockerRegistry) SetupWebhookWithManager(mgr ctrl.Manager) error {
	return ctrl.NewWebhookManagedBy(mgr).
		For(r).
		Complete()
}

// +kubebuilder:webhook:path=/mutate-core-kalm-dev-v1alpha1-dockerregistry,mutating=true,failurePolicy=fail,groups=core.kalm.dev,resources=dockerregistries,verbs=create;update,versions=v1alpha1,name=mdockerregistry.kb.io

var _ webhook.Defaulter = &DockerRegistry{}

// The empty host is a special value for docker hub. Do not change it
func (r *DockerRegistry) Default() {

}

// +kubebuilder:webhook:verbs=create;update;delete,path=/validate-core-kalm-dev-v1alpha1-dockerregistry,mutating=false,failurePolicy=fail,groups=core.kalm.dev,resources=dockerregistries,versions=v1alpha1,name=vdockerregistry.kb.io

var _ webhook.Validator = &DockerRegistry{}

// ValidateCreate implements webhook.Validator so a webhook will be registered for the type
func (r *DockerRegistry) ValidateCreate() error {
	dockerregistrylog.Info("validate create", "name", r.Name)

	if err := r.validate(); err != nil {
		return err
	}

	return nil
}

// ValidateUpdate implements webhook.Validator so a webhook will be registered for the type
func (r *DockerRegistry) ValidateUpdate(old runtime.Object) error {
	dockerregistrylog.Info("validate update", "name", r.Name)
	return r.validate()
}

// ValidateDelete implements webhook.Validator so a webhook will be registered for the type
func (r *DockerRegistry) ValidateDelete() error {
	dockerregistrylog.Info("validate delete", "name", r.Name)
	return nil
}

func (r *DockerRegistry) validate() error {
	var rst KalmValidateErrorList

	if r.Spec.Host != "" {
		if isValid := isValidURL(r.Spec.Host); !isValid {
			rst = append(rst, KalmValidateError{
				Err:  "invalid url",
				Path: "spec.host",
			})
		}
	}

	intervalSec := r.Spec.PoolingIntervalSeconds
	if intervalSec != nil {
		if *intervalSec <= 0 {
			rst = append(rst, KalmValidateError{
				Err:  "should be positive int",
				Path: "spec.poolingIntervalSeconds",
			})
		}
	}

	if len(rst) == 0 {
		return nil
	}

	return rst
}
