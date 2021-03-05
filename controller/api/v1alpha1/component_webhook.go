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
	"math/rand"
	"strings"
	"time"

	"github.com/robfig/cron"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/runtime"
	apimachineryval "k8s.io/apimachinery/pkg/util/validation"
	"k8s.io/apimachinery/pkg/util/validation/field"
	ctrl "sigs.k8s.io/controller-runtime"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/webhook"
)

// log is for logging in this package.
var componentlog = logf.Log.WithName("component-webhook")

func (r *Component) SetupWebhookWithManager(mgr ctrl.Manager) error {
	return ctrl.NewWebhookManagedBy(mgr).
		For(r).
		Complete()
}

// +kubebuilder:webhook:path=/mutate-core-kalm-dev-v1alpha1-component,mutating=true,failurePolicy=fail,groups=core.kalm.dev,resources=components,verbs=create;update,versions=v1alpha1,name=mcomponent.kb.io

var _ webhook.Defaulter = &Component{}

// Default implements webhook.Defaulter so a webhook will be registered for the type
func (r *Component) Default() {
	componentlog.Info("default", "ns", r.Namespace, "name", r.Name)

	if r.Spec.Command != "" {
		r.Spec.Command = strings.TrimSpace(r.Spec.Command)
	}

	if r.Spec.WorkloadType == "" {
		r.Spec.WorkloadType = WorkloadTypeServer
	}

	if r.Spec.Replicas == nil {
		defaultReplicas := int32(1)
		r.Spec.Replicas = &defaultReplicas
	}

	// set service port
	if r.Spec.Ports != nil {
		for i, port := range r.Spec.Ports {
			if port.ServicePort == 0 {
				r.Spec.Ports[i].ServicePort = port.ContainerPort
			}
		}
	}

	if r.Spec.TerminationGracePeriodSeconds == nil {
		x := int64(30)
		r.Spec.TerminationGracePeriodSeconds = &x
	}

	for i, vol := range r.Spec.Volumes {
		switch vol.Type {
		case VolumeTypeHostPath:
			if vol.HostPath != "" && vol.Path == "" {
				vol.Path = vol.HostPath
			}

			if vol.HostPath == "" && vol.Path != "" {
				vol.HostPath = vol.Path
			}
		case VolumeTypePersistentVolumeClaimTemplate, VolumeTypePersistentVolumeClaim:
			if vol.PVC == "" {
				genPVCName := fmt.Sprintf("pvc-%s-%d-%d", r.Name, time.Now().Unix(), rand.Intn(10000))
				vol.PVC = genPVCName
			}
		}

		r.Spec.Volumes[i] = vol
	}

	if !IsKalmSystemNamespace(r.Namespace) {
		// set default resourceRequirement & limits
		r.setupResourceRequirementIfAbsent()

		// set for istio proxy
		r.setupIstioResourceRequirementIfAbsent()
	}
}

// +kubebuilder:webhook:verbs=create;update;delete,path=/validate-core-kalm-dev-v1alpha1-component,mutating=false,failurePolicy=fail,groups=core.kalm.dev,resources=components,versions=v1alpha1,name=vcomponent.kb.io

var _ webhook.Validator = &Component{}

// ValidateCreate implements webhook.Validator so a webhook will be registered for the type
func (r *Component) ValidateCreate() error {
	componentlog.Info("validate create", "ns", r.Namespace, "name", r.Name)

	if errList := r.validate(); len(errList) > 0 {
		componentlog.Error(errList, "validate fail")
		return error(errList)
	}

	return nil
}

// ValidateUpdate implements webhook.Validator so a webhook will be registered for the type
func (r *Component) ValidateUpdate(old runtime.Object) error {
	componentlog.Info("validate update", "ns", r.Namespace, "name", r.Name)

	var volErrList KalmValidateErrorList
	// for sts, persistent vols should NOT be updated
	if r.Spec.WorkloadType == WorkloadTypeStatefulSet {
		if oldComponent, ok := old.(*Component); !ok {
			componentlog.Info("oldObject is not *Component")
		} else {
			volMapNew := getStsTemplateVolMap(r)
			volMapOld := getStsTemplateVolMap(oldComponent)

			if same, err := isIdenticalVolMap(volMapNew, volMapOld); !same {
				volErrList = append(volErrList, KalmValidateError{
					Err: fmt.Sprintf("should not update volume of type: %s for workload: statefulset, err: %s",
						VolumeTypePersistentVolumeClaimTemplate,
						err,
					),
					Path: "spec.volumes",
				})
			}
		}
	}

	commonValidateErr := r.validate()
	volErrList = append(volErrList, commonValidateErr...)

	if len(volErrList) > 0 {
		return error(volErrList)
	}

	return nil
}

func isIdenticalVolMap(mapNew map[string]Volume, mapOld map[string]Volume) (bool, error) {

	if len(mapNew) != len(mapOld) {
		return false, fmt.Errorf("vol size not the same")
	}

	for volName, volNew := range mapNew {
		volOld, exist := mapOld[volName]
		if !exist {
			return false, fmt.Errorf("volume not exist in old resource: %s", volName)
		}

		// storage request
		storageRequestNew := volNew.Size
		storageRequestOld := volOld.Size
		if !storageRequestNew.Equal(storageRequestOld) {
			return false, fmt.Errorf("volume size changed, %s -> %s",
				storageRequestOld.String(),
				storageRequestNew.String(),
			)
		}

		// storageClass
		scNew := volNew.StorageClassName
		scOld := volOld.StorageClassName

		if scNew != nil && scOld != nil && *scNew != *scOld {
			return false, fmt.Errorf("not same storage class: %s -> %s",
				*volOld.StorageClassName,
				*volNew.StorageClassName)
		}
	}

	return true, nil
}

func getStsTemplateVolMap(component *Component) map[string]Volume {
	rst := make(map[string]Volume)

	for _, vol := range component.Spec.Volumes {
		if component.Spec.WorkloadType != WorkloadTypeStatefulSet {
			continue
		}

		if vol.Type != VolumeTypePersistentVolumeClaimTemplate {
			continue
		}

		rst[vol.PVC] = vol
	}

	return rst
}

func (r *Component) validate() KalmValidateErrorList {
	var rst KalmValidateErrorList

	rst = append(rst, r.validateEnvVarList()...)
	rst = append(rst, validateLabels(r.Spec.NodeSelectorLabels, ".spec.nodeSelectorLabels")...)
	rst = append(rst, r.validateScheduleOfComponentIfIsCronJob()...)
	rst = append(rst, r.validateProbes()...)
	rst = append(rst, r.validateResRequirement()...)
	rst = append(rst, r.validateVolumesOfComponent()...)
	rst = append(rst, r.validateRunnerPermission()...)
	rst = append(rst, r.validatePreInjectedFiles()...)

	if len(rst) == 0 {
		return nil
	}

	componentlog.Info("component fail validate() in webhook", "errList", rst)
	return rst
}

// ValidateDelete implements webhook.Validator so a webhook will be registered for the type
func (r *Component) ValidateDelete() error {
	componentlog.Info("validate delete", "name", r.Name)
	return nil
}

func (r *Component) validateVolumesOfComponent() (rst KalmValidateErrorList) {
	vols := r.Spec.Volumes

	for i, vol := range vols {
		if !isValidPath(vol.Path) {
			rst = append(rst, KalmValidateError{
				Err:  "invalid path:" + vol.Path,
				Path: fmt.Sprintf(".spec.volumes[%d].path", i),
			})
		}

		// size
		fld := field.NewPath(fmt.Sprintf(".spec.volumes[%d].size", i))
		errList := ValidateResourceQuantityValue(vol.Size, fld, true)
		rst = append(rst, toKalmValidateErrors(errList)...)

		if vol.Type == VolumeTypeTemporaryDisk || vol.Type == VolumeTypeTemporaryMemory {
			if vol.Size.IsZero() {
				rst = append(rst, KalmValidateError{
					Err:  "must set size for this volume",
					Path: fmt.Sprintf(".spec.volumes[%d].size", i),
				})
			}
		}

		// for pvc && pvcTemplate vol, field: pvc must be set
		if vol.Type == VolumeTypePersistentVolumeClaim ||
			vol.Type == VolumeTypePersistentVolumeClaimTemplate {

			if vol.PVC == "" {
				rst = append(rst, KalmValidateError{
					Err:  "must set pvc for this volume",
					Path: fmt.Sprintf(".spec.volumes[%d]", i),
				})
			}
		}

		if vol.Type == VolumeTypeHostPath {
			if vol.HostPath == "" {
				rst = append(rst, KalmValidateError{
					Err:  "must set hostPath for this volume",
					Path: fmt.Sprintf(".spec.volumes[%d].hostPath", i),
				})
			}

			if vol.Path == "" {
				rst = append(rst, KalmValidateError{
					Err:  "must set path for this volume",
					Path: fmt.Sprintf(".spec.volumes[%d].path", i),
				})
			}
		}
	}

	// sts use volType: pvcTemplate instead pvc
	if r.Spec.WorkloadType == WorkloadTypeStatefulSet {
		for i, vol := range vols {
			if vol.Type == VolumeTypePersistentVolumeClaim {
				rst = append(rst, KalmValidateError{
					Err: fmt.Sprintf("for workload %s, use %s instead of %s",
						WorkloadTypeStatefulSet, VolumeTypePersistentVolumeClaimTemplate, VolumeTypePersistentVolumeClaim),
					Path: fmt.Sprintf(".spec.volumes[%d].type", i),
				})
			}
		}
	}

	// for dp, volType should be pvc
	if r.Spec.WorkloadType == WorkloadTypeServer {
		for i, vol := range vols {
			if vol.Type == VolumeTypePersistentVolumeClaimTemplate {
				rst = append(rst, KalmValidateError{
					Err: fmt.Sprintf("for workload %s, use %s instead of %s",
						WorkloadTypeServer, VolumeTypePersistentVolumeClaim, VolumeTypePersistentVolumeClaimTemplate),
					Path: fmt.Sprintf(".spec.volumes[%d].type", i),
				})
			}
		}
	}

	// for simpleWorkload using pvc, constraints on replicas
	if r.isStatelessWorkload() && r.Spec.Replicas != nil && *r.Spec.Replicas > 1 {
		usingPVC := false
		for _, vol := range r.Spec.Volumes {
			if vol.Type != VolumeTypePersistentVolumeClaim {
				continue
			}

			usingPVC = true
			break
		}

		if usingPVC {
			rst = append(rst, KalmValidateError{
				Err: fmt.Sprintf("stateless workload %s that has more than 1 replicas can't use ReadWriteOnce PVC",
					r.Spec.WorkloadType,
				),
				Path: ".spec.replicas",
			})
		}
	}

	return rst
}

func (r *Component) isStatelessWorkload() bool {
	switch r.Spec.WorkloadType {
	case WorkloadTypeServer, WorkloadTypeDaemonSet, WorkloadTypeCronjob:
		return true
	default:
		return false
	}
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
	if valid, errList := isValidLabels(labels, field.NewPath(fieldPath)); !valid {
		return toKalmValidateErrors(errList)
	}

	return rst
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

func (r *Component) validateEnvVarList() (rst KalmValidateErrorList) {
	if len(r.Spec.Env) == 0 {
		return nil
	}

	for i, env := range r.Spec.Env {
		errs := apimachineryval.IsCIdentifier(env.Name)
		for _, err := range errs {
			rst = append(rst, KalmValidateError{
				Err:  err,
				Path: fmt.Sprintf(".spec.env[%d]", i),
			})
		}
	}

	return rst
}

func (r *Component) validateResRequirement() (rst KalmValidateErrorList) {
	resRequirement := r.Spec.ResourceRequirements
	if resRequirement == nil {
		return nil
	}

	resList := []v1.ResourceName{v1.ResourceCPU, v1.ResourceMemory}
	for _, resName := range resList {
		isIntegerRes := resName == v1.ResourceMemory

		if limit, exist := resRequirement.Limits[resName]; exist {

			fldPath := field.NewPath("spec.resourceRequirements.limits." + string(resName))
			errList := ValidateResourceQuantityValue(limit, fldPath, isIntegerRes)
			rst = append(rst, toKalmValidateErrors(errList)...)
		}

		if request, exist := resRequirement.Requests[resName]; exist {
			fldPath := field.NewPath("spec.resourceRequirements.requests." + string(resName))
			errList := ValidateResourceQuantityValue(request, fldPath, isIntegerRes)
			rst = append(rst, toKalmValidateErrors(errList)...)
		}
	}

	return rst
}

func (r *Component) validatePreInjectedFiles() (rst KalmValidateErrorList) {
	for i, preInjectFile := range r.Spec.PreInjectedFiles {
		isPrefixOK := strings.HasPrefix(preInjectFile.MountPath, "/")
		if !isPrefixOK {
			rst = append(rst, KalmValidateError{
				Err:  "should start with: /",
				Path: fmt.Sprintf(".spec.preInjectedFiles[%d]", i),
			})
		}
	}

	return rst
}

func (r *Component) validateRunnerPermission() (rst KalmValidateErrorList) {
	runnerPermission := r.Spec.RunnerPermission
	if runnerPermission == nil {
		return nil
	}

	isNamespaced := runnerPermission.RoleType != "clusterRole"

	for i, rule := range runnerPermission.Rules {
		path := field.NewPath(fmt.Sprintf(".spec.runnerPermission.rules[%d]", i))

		errList := validatePolicyRule(rule, isNamespaced, path)
		rst = append(rst, toKalmValidateErrors(errList)...)
	}

	return rst
}

func fillResourceRequirementIfAbsent(requirements *v1.ResourceRequirements, cpu, mem resource.Quantity) *v1.ResourceRequirements {
	var rst *v1.ResourceRequirements
	if requirements == nil {
		rst = &v1.ResourceRequirements{}
	} else {
		rst = requirements.DeepCopy()
	}

	if rst.Limits == nil {
		rst.Limits = make(map[v1.ResourceName]resource.Quantity)
	}
	if rst.Requests == nil {
		rst.Requests = make(map[v1.ResourceName]resource.Quantity)
	}

	limits := rst.Limits
	requests := rst.Requests

	// Limits

	// if request exist, set limit same as request
	if _, exist := limits[v1.ResourceCPU]; !exist {
		if req, exist := requests[v1.ResourceCPU]; exist {
			limits[v1.ResourceCPU] = req
		} else {
			limits[v1.ResourceCPU] = cpu
		}
	}

	if _, exist := limits[v1.ResourceMemory]; !exist {
		if req, exist := requests[v1.ResourceMemory]; exist {
			limits[v1.ResourceMemory] = req
		} else {
			limits[v1.ResourceMemory] = mem
		}
	}

	rst.Limits = limits

	// Requests

	// start with really low request here
	if _, exist := requests[v1.ResourceCPU]; !exist {
		requests[v1.ResourceCPU] = resource.MustParse("1m")
	}
	if _, exist := requests[v1.ResourceMemory]; !exist {
		requests[v1.ResourceMemory] = resource.MustParse("1Mi")
	}
	rst.Requests = requests

	return rst
}

func (r *Component) setupResourceRequirementIfAbsent() {
	defaultCPULimit := resource.MustParse("200m")
	defaultMemoryLimit := resource.MustParse("128Mi")

	filledResRequirement := fillResourceRequirementIfAbsent(r.Spec.ResourceRequirements, defaultCPULimit, defaultMemoryLimit)

	r.Spec.ResourceRequirements = filledResRequirement
}

func (r *Component) setupIstioResourceRequirementIfAbsent() {
	defaultCPULimit := resource.MustParse("100m")
	defaultMemoryLimit := resource.MustParse("128Mi")

	filledResRequirement := fillResourceRequirementIfAbsent(r.Spec.IstioResourceRequirements, defaultCPULimit, defaultMemoryLimit)

	r.Spec.IstioResourceRequirements = filledResRequirement
}
