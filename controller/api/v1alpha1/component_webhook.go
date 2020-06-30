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
var componentlog = logf.Log.WithName("component-resource")

func (r *Component) SetupWebhookWithManager(mgr ctrl.Manager) error {
	return ctrl.NewWebhookManagedBy(mgr).
		For(r).
		Complete()
}

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!

// +kubebuilder:webhook:path=/mutate-core-kapp-dev-v1alpha1-component,mutating=true,failurePolicy=fail,groups=core.kapp.dev,resources=components,verbs=create;update,versions=v1alpha1,name=mcomponent.kb.io

var _ webhook.Defaulter = &Component{}

// Default implements webhook.Defaulter so a webhook will be registered for the type
func (r *Component) Default() {
	componentlog.Info("default", "name", r.Name)

	// TODO(user): fill in your defaulting logic.
}

// TODO(user): change verbs to "verbs=create;update;delete" if you want to enable deletion validation.
// +kubebuilder:webhook:verbs=create;update,path=/validate-core-kapp-dev-v1alpha1-component,mutating=false,failurePolicy=fail,groups=core.kapp.dev,resources=components,versions=v1alpha1,name=vcomponent.kb.io

var _ webhook.Validator = &Component{}

// ValidateCreate implements webhook.Validator so a webhook will be registered for the type
func (r *Component) ValidateCreate() error {
	componentlog.Info("validate create", "name", r.Name)

	if err := r.validateVolumeOfComponent(); err != nil {
		return err
	}

	return nil
}

// ValidateUpdate implements webhook.Validator so a webhook will be registered for the type
func (r *Component) ValidateUpdate(old runtime.Object) error {
	componentlog.Info("validate update", "name", r.Name)

	if err := r.validateVolumeOfComponent(); err != nil {
		return err
	}

	return nil
}

// ValidateDelete implements webhook.Validator so a webhook will be registered for the type
func (r *Component) ValidateDelete() error {
	componentlog.Info("validate delete", "name", r.Name)
	return nil
}

func (r *Component) validateVolumeOfComponent() error {
	vols := r.Spec.Volumes

	for i, vol := range vols {
		if vol.Type != VolumeTypePersistentVolumeClaim {
			continue
		}

		// for pvc vol

		// 1. field: pvc must be set
		if vol.PVC == "" {
			return KappValidateError{
				Err:  "must set pvc for volume",
				Path: fmt.Sprintf(".spec.volumes[%d]", i),
			}
		}

		// 2. if pvToMatch is set, pv must exist
		if vol.PVToMatch != "" {

		}

	}

	return nil
}
