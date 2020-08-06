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
	"github.com/robfig/cron"
	apimachineryvalidation "k8s.io/apimachinery/pkg/api/validation"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/util/validation/field"
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

// +kubebuilder:webhook:path=/mutate-core-kalm-dev-v1alpha1-component,mutating=true,failurePolicy=fail,groups=core.kalm.dev,resources=components,verbs=create;update,versions=v1alpha1,name=mcomponent.kb.io

var _ webhook.Defaulter = &Component{}

// Default implements webhook.Defaulter so a webhook will be registered for the type
func (r *Component) Default() {
	componentlog.Info("default", "name", r.Name)

	if r.Spec.WorkloadType == "" {
		r.Spec.WorkloadType = WorkloadTypeServer
	}

	if r.Spec.Replicas == nil {
		zeroReplicas := int32(0)
		r.Spec.Replicas = &zeroReplicas
	}

	// set service port
	if r.Spec.Ports != nil {
		for i, port := range r.Spec.Ports {
			if port.ServicePort == 0 {
				r.Spec.Ports[i].ServicePort = port.ContainerPort
			}
		}
	}
}

// +kubebuilder:webhook:verbs=create;update,path=/validate-core-kalm-dev-v1alpha1-component,mutating=false,failurePolicy=fail,groups=core.kalm.dev,resources=components,versions=v1alpha1,name=vcomponent.kb.io

var _ webhook.Validator = &Component{}

// ValidateCreate implements webhook.Validator so a webhook will be registered for the type
func (r *Component) ValidateCreate() error {
	componentlog.Info("validate create", "name", r.Name)

	if err := r.validateVolumeOfComponent(); err != nil {
		return err
	}

	if err := r.validateScheduleOfComponentIfIsCronJob(); err != nil {
		return err
	}

	if err := validateLabels(r.Spec.NodeSelectorLabels, ".spec.nodeSelectorLabels"); err != nil {
		return err
	}

	if err := r.validateProbes(); err != nil {
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

	if err := r.validateScheduleOfComponentIfIsCronJob(); err != nil {
		return err
	}

	if err := validateLabels(r.Spec.NodeSelectorLabels, ".spec.nodeSelectorLabels"); err != nil {
		return err
	}

	if err := r.validateProbes(); err != nil {
		return err
	}

	return nil
}

// ValidateDelete implements webhook.Validator so a webhook will be registered for the type
func (r *Component) ValidateDelete() error {
	componentlog.Info("validate delete", "name", r.Name)
	return nil
}

func (r *Component) validateVolumeOfComponent() (rst KalmValidateErrorList) {
	vols := r.Spec.Volumes

	for i, vol := range vols {
		if vol.Type != VolumeTypePersistentVolumeClaim {
			continue
		}

		// for pvc vol

		// 1. field: pvc must be set
		if vol.PVC == "" {
			rst = append(rst, KalmValidateError{
				Err:  "must set pvc for this volume",
				Path: fmt.Sprintf(".spec.volumes[%d]", i),
			})
		}

		//// 2. if pvToMatch is set, pv must exist
		// todo no idea how to call k8s api in validator
		//if vol.PVToMatch != "" {
		//
		//}

		fld := field.NewPath(fmt.Sprintf(".spec.volumes[%d].size", i))
		errList := ValidateResourceQuantityValue(vol.Size, fld)
		rst = append(rst, toKalmValidateErrors(errList)...)
	}

	return
}

func (r *Component) validateScheduleOfComponentIfIsCronJob() (rst KalmValidateErrorList) {
	if r.Spec.WorkloadType != WorkloadTypeCronjob {
		return nil
	}

	_, err := cron.ParseStandard(r.Spec.Schedule)
	if err != nil {
		rst = append(rst, KalmValidateError{
			Err:  err.Error(),
			Path: ".spec.schedule",
		})
	}

	return
}

func validateLabels(labels map[string]string, fieldPath string) (rst KalmValidateErrorList) {

	for _, label := range labels {
		errs := apimachineryvalidation.NameIsDNSLabel(label, false)
		for _, err := range errs {
			rst = append(rst, KalmValidateError{
				Err:  err,
				Path: fieldPath,
			})
		}
	}

	return
}

func (r *Component) validateProbes() (rst KalmValidateErrorList) {
	livenessProbe := r.Spec.LivenessProbe
	if livenessProbe != nil {
		errs := validateProbe(livenessProbe, field.NewPath(".spec.livenessProbe"))

		rst = append(rst, toKalmValidateErrors(errs)...)
	}

	readinessProbe := r.Spec.ReadinessProbe
	if readinessProbe != nil {
		errs := validateProbe(readinessProbe, field.NewPath(".spec.readinessProbe"))

		rst = append(rst, toKalmValidateErrors(errs)...)
	}

	return
}
