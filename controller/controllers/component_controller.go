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

package controllers

import (
	"context"
	"crypto/md5"
	"encoding/json"
	"fmt"
	js "github.com/dop251/goja"
	"github.com/kapp-staging/kapp/lib/files"
	"github.com/kapp-staging/kapp/util"
	"github.com/kapp-staging/kapp/vm"
	"github.com/xeipuuv/gojsonschema"
	appsV1 "k8s.io/api/apps/v1"
	batchV1 "k8s.io/api/batch/v1"
	batchV1Beta1 "k8s.io/api/batch/v1beta1"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/intstr"

	"github.com/go-logr/logr"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	corev1alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
)

// ComponentReconciler reconciles a Component object
type ComponentReconciler struct {
	client.Client
	Reader client.Reader
	Log    logr.Logger
	Scheme *runtime.Scheme

	// The following fields will be filled by calling SetupAttributes() function
	ctx         context.Context
	component   *corev1alpha1.Component
	application *corev1alpha1.Application

	// related resources
	service     *coreV1.Service
	cronJob     *batchV1Beta1.CronJob
	deployment  *appsV1.Deployment
	daemonSet   *appsV1.DaemonSet
	statefulSet *appsV1.StatefulSet
}

// +kubebuilder:rbac:groups=core.kapp.dev,resources=components,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=components/status,verbs=get;update;patch

func (r *ComponentReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	r.ctx = context.Background()
	r.Log = r.Log.WithValues("component", req.NamespacedName)

	if err := r.SetupAttributes(req); err != nil {
		return ctrl.Result{}, err
	}

	if err := r.LoadResources(); err != nil {
		return ctrl.Result{}, err
	}

	if err := r.HandleDelete(); err != nil {
		return ctrl.Result{}, err
	}

	if !r.component.ObjectMeta.DeletionTimestamp.IsZero() {
		return ctrl.Result{}, nil
	}

	if err := r.ReconcileService(); err != nil {
		return ctrl.Result{}, err
	}

	if err := r.ReconcileWorkload(); err != nil {
		return ctrl.Result{}, err
	}

	return ctrl.Result{}, nil
}

func (r *ComponentReconciler) GetLabels() map[string]string {
	return map[string]string{
		"kapp-application": r.application.Name,
		"kapp-component":   r.component.Name,
	}
}

func (r *ComponentReconciler) ReconcileService() (err error) {
	labels := r.GetLabels()
	if len(r.component.Spec.Ports) > 0 {
		newService := false

		if r.service == nil {
			newService = true
			r.service = &coreV1.Service{
				ObjectMeta: metaV1.ObjectMeta{
					Name:      r.component.Name,
					Namespace: r.component.Namespace,
					Labels:    labels,
				},
				Spec: coreV1.ServiceSpec{
					Selector: labels,
				},
			}
		}

		var ps []coreV1.ServicePort
		for _, port := range r.component.Spec.Ports {
			// if service port is missing, set it same as containerPort
			if port.ServicePort == 0 && port.ContainerPort != 0 {
				port.ServicePort = port.ContainerPort
			}

			sp := coreV1.ServicePort{
				Name:       port.Name,
				TargetPort: intstr.FromInt(int(port.ContainerPort)),
				Port:       int32(port.ServicePort),
			}

			if port.Protocol != "" {
				sp.Protocol = port.Protocol
			}

			ps = append(ps, sp)
		}

		r.service.Spec.Ports = ps

		// TODO service Plugin call

		if newService {
			//if err := ctrl.SetControllerReference(app, service, r.Scheme); err != nil {
			//	return err
			//}

			if err := r.Create(r.ctx, r.service); err != nil {
				r.Log.Error(err, "unable to create Service for Component")
				return err
			}
		} else {
			if err := r.Update(r.ctx, r.service); err != nil {
				r.Log.Error(err, "unable to update Service for Component")
				return err
			}
		}
	} else if r.service != nil {
		if err := r.Delete(r.ctx, r.service); err != nil {
			r.Log.Error(err, "unable to delete Service for Application Component")
			return err
		}
	}

	return r.LoadService()
}

func (r *ComponentReconciler) ReconcileWorkload() (err error) {
	template, err := r.GetPodTemplate()

	if err != nil {
		return err
	}

	switch r.component.Spec.WorkLoadType {
	case corev1alpha1.WorkloadTypeServer:
		return r.ReconcileDeployment(template)
	case corev1alpha1.WorkloadTypeCronjob:
		return r.ReconcileCronJob(template)
	case corev1alpha1.WorkloadTypeDaemonSet:
		return r.ReconcileDaemonSet()
	case corev1alpha1.WorkloadTypeStatefulSet:
		return r.ReconcileStatefulSet()
	default:
		return fmt.Errorf("unknown workload type %s", string(r.component.Spec.WorkLoadType))
	}
}

func (r *ComponentReconciler) ReconcileDeployment(podTemplateSpec *coreV1.PodTemplateSpec) (err error) {
	app := r.application
	component := &r.component.Spec
	log := r.Log
	ctx := r.ctx
	deployment := r.deployment
	isNewDeployment := false
	labelMap := r.GetLabels()

	if deployment == nil {
		isNewDeployment = true

		deployment = &appsV1.Deployment{
			ObjectMeta: metaV1.ObjectMeta{
				Labels:      labelMap,
				Annotations: make(map[string]string),
				Name:        getDeploymentName(app.Name, component.Name),
				Namespace:   app.Namespace,
			},
			Spec: appsV1.DeploymentSpec{
				Template: *podTemplateSpec,
				Selector: &metaV1.LabelSelector{
					MatchLabels: labelMap,
				},
			},
		}
	} else {
		deployment.Spec.Template = *podTemplateSpec
	}

	// replicas
	// TODO consider to move to plugin
	if component.Replicas == nil {
		defaultComponentReplicas := int32(1)
		deployment.Spec.Replicas = &defaultComponentReplicas
	} else {
		deployment.Spec.Replicas = component.Replicas
	}

	//if len(component.Ports) > 0 {
	//	var ports []coreV1.ContainerPort
	//	for _, p := range component.Ports {
	//		ports = append(ports, coreV1.ContainerPort{
	//			Name:          p.Name,
	//			ContainerPort: int32(p.ContainerPort),
	//			Protocol:      p.Protocol,
	//		})
	//	}
	//}

	// apply plugins
	for _, pluginDef := range component.Plugins {
		plugin := corev1alpha1.GetPlugin(pluginDef)

		switch p := plugin.(type) {
		case *corev1alpha1.PluginManualScaler:
			p.Operate(deployment)
		}
	}

	if isNewDeployment {
		if err := ctrl.SetControllerReference(app, deployment, r.Scheme); err != nil {
			log.Error(err, "unable to set owner for deployment")
			return err
		}

		if err := r.Create(ctx, deployment); err != nil {
			log.Error(err, "unable to create Deployment for Application")
			return err
		}

		log.Info("create Deployment " + deployment.Name)
	} else {
		if err := r.Update(ctx, deployment); err != nil {
			log.Error(err, "unable to update Deployment for Application")
			return err
		}

		log.Info("update Deployment " + deployment.Name)
	}

	// apply plugins
	for _, pluginDef := range app.Spec.Components[0].Plugins {
		plugin := corev1alpha1.GetPlugin(pluginDef)

		switch p := plugin.(type) {
		case *corev1alpha1.PluginManualScaler:
			p.Operate(deployment)
		}
	}

	return r.runPlugins(PluginMethodBeforeDeploymentSave, component, deployment, deployment)
}
func (r *ComponentReconciler) ReconcileCronJob(podTemplateSpec *coreV1.PodTemplateSpec) (err error) {
	app := r.application
	log := r.Log
	ctx := r.ctx
	cj := r.cronJob
	component := r.component.Spec
	labelMap := r.GetLabels()

	// restartPolicy
	if podTemplateSpec.Spec.RestartPolicy == coreV1.RestartPolicyAlways ||
		podTemplateSpec.Spec.RestartPolicy == "" {

		podTemplateSpec.Spec.RestartPolicy = coreV1.RestartPolicyOnFailure

	}

	successJobHistoryLimit := int32(3)
	failJobHistoryLimit := int32(5)

	desiredCJSpec := batchV1Beta1.CronJobSpec{
		Schedule: component.Schedule,
		JobTemplate: batchV1Beta1.JobTemplateSpec{
			Spec: batchV1.JobSpec{
				Template: *podTemplateSpec,
			},
		},
		SuccessfulJobsHistoryLimit: &successJobHistoryLimit,
		FailedJobsHistoryLimit:     &failJobHistoryLimit,
	}

	var isNewCJ bool
	if cj == nil {
		isNewCJ = true

		cj = &batchV1Beta1.CronJob{
			ObjectMeta: metaV1.ObjectMeta{
				Name:      getCronJobName(app.Name, component.Name),
				Namespace: app.Namespace,
				Labels:    labelMap,
			},
			Spec: desiredCJSpec,
		}
	} else {
		cj.Spec = desiredCJSpec
	}

	if isNewCJ {
		if err := ctrl.SetControllerReference(app, cj, r.Scheme); err != nil {
			log.Error(err, "unable to set owner for cronJob")
			return err
		}

		if err := r.Create(ctx, cj); err != nil {
			log.Error(err, "unable to create CronJob for Application")
			return err
		}

		log.Info("create CronJob " + cj.Name)
	} else {
		if err := r.Update(ctx, cj); err != nil {
			log.Error(err, "unable to update CronJob for Application")
			return err
		}

		log.Info("update CronJob:" + cj.Name)
	}

	return nil
}

func (r *ComponentReconciler) ReconcileDaemonSet() (err error) {
	return fmt.Errorf("Not implement.")
}

func (r *ComponentReconciler) ReconcileStatefulSet() (err error) {
	return fmt.Errorf("Not implement.")
}

func (r *ComponentReconciler) GetPodTemplate() (template *coreV1.PodTemplateSpec, err error) {
	componentSpec := &r.component.Spec

	template = &coreV1.PodTemplateSpec{
		ObjectMeta: metaV1.ObjectMeta{
			Labels: getComponentLabels(r.application.Name, componentSpec.Name),
		},
		Spec: coreV1.PodSpec{
			Containers: []coreV1.Container{
				{
					Name:    componentSpec.Name,
					Image:   componentSpec.Image,
					Env:     []coreV1.EnvVar{},
					Command: componentSpec.Command,
					Args:    componentSpec.Args,
					Resources: coreV1.ResourceRequirements{
						Requests: make(map[coreV1.ResourceName]resource.Quantity),
						Limits:   make(map[coreV1.ResourceName]resource.Quantity),
					},
					ReadinessProbe: componentSpec.ReadinessProbe,
					LivenessProbe:  componentSpec.LivenessProbe,
				},
			},
		},
	}

	//decide affinity
	if affinity, exist := decideAffinityNew(r.application.Name, componentSpec); exist {
		template.Spec.Affinity = affinity
	}

	mainContainer := &template.Spec.Containers[0]

	// resources
	if componentSpec.CPU != nil && !componentSpec.CPU.IsZero() {
		mainContainer.Resources.Requests[coreV1.ResourceCPU] = *componentSpec.CPU
		mainContainer.Resources.Limits[coreV1.ResourceCPU] = *componentSpec.CPU
	}

	if componentSpec.Memory != nil && !componentSpec.Memory.IsZero() {
		mainContainer.Resources.Limits[coreV1.ResourceMemory] = *componentSpec.Memory
		mainContainer.Resources.Limits[coreV1.ResourceMemory] = *componentSpec.Memory
	}

	// set image secret
	if r.application.Spec.ImagePullSecretName != "" {
		secs := []coreV1.LocalObjectReference{
			{Name: r.application.Spec.ImagePullSecretName},
		}
		template.Spec.ImagePullSecrets = secs
	}

	// apply envs
	var envs []coreV1.EnvVar
	for _, env := range componentSpec.Env {
		var value string

		if env.Type == "" || env.Type == corev1alpha1.EnvVarTypeStatic {
			value = env.Value
		} else if env.Type == corev1alpha1.EnvVarTypeExternal {
			// TODO shared env
			//	value, err = r.FindShareEnvValue(env.Value)
			//
			//	//  if the env can't be found in sharedEnv, ignore it
			//	if err != nil {
			//		continue
			//	}
		} else if env.Type == corev1alpha1.EnvVarTypeLinked {
			// TODO linked env
			//value, err = r.getValueOfLinkedEnv(env)
			//if err != nil {
			//	return nil, err
			//}
		}

		envs = append(envs, coreV1.EnvVar{
			Name:  env.Name,
			Value: value,
		})
	}

	mainContainer.Env = envs

	// Volumes
	// add volumes & volumesMounts
	var volumes []coreV1.Volume
	var volumeMounts []coreV1.VolumeMount
	for i, disk := range componentSpec.Volumes {
		volumeSource := coreV1.VolumeSource{}

		// TODO generate this name at api level
		pvcName := fmt.Sprintf("%s-%s-%x", r.application.Name, componentSpec.Name, md5.Sum([]byte(disk.Path)))

		if disk.Type == corev1alpha1.VolumeTypePersistentVolumeClaim {
			var pvc *coreV1.PersistentVolumeClaim

			if disk.PersistentVolumeClaimName != "" {
				pvcName = disk.PersistentVolumeClaimName
			}

			pvcFetched, err := r.getPVC(pvcName)

			if err != nil {
				return nil, err
			}

			if pvcFetched != nil {
				pvc = pvcFetched
			} else {
				pvc = &coreV1.PersistentVolumeClaim{
					ObjectMeta: metaV1.ObjectMeta{
						Name:      pvcName,
						Namespace: r.application.Namespace,
						Labels:    getComponentLabels(r.application.Name, componentSpec.Name),
					},
					Spec: coreV1.PersistentVolumeClaimSpec{
						AccessModes: []coreV1.PersistentVolumeAccessMode{coreV1.ReadWriteOnce},
						Resources: coreV1.ResourceRequirements{
							Requests: coreV1.ResourceList{
								coreV1.ResourceStorage: disk.Size,
							},
						},
						StorageClassName: disk.StorageClassName,
					},
				}

				if err := r.Create(r.ctx, pvc); err != nil {
					return nil, fmt.Errorf("fail to create PVC: %s, %s", pvc.Name, err)
				}

				componentSpec.Volumes[i].PersistentVolumeClaimName = pvcName
			}

			volumeSource.PersistentVolumeClaim = &coreV1.PersistentVolumeClaimVolumeSource{
				ClaimName: pvcName,
			}

		} else if disk.Type == corev1alpha1.VolumeTypeTemporaryDisk {
			volumeSource.EmptyDir = &coreV1.EmptyDirVolumeSource{
				Medium: coreV1.StorageMediumDefault,
			}
		} else if disk.Type == corev1alpha1.VolumeTypeTemporaryMemory {
			volumeSource.EmptyDir = &coreV1.EmptyDirVolumeSource{
				Medium: coreV1.StorageMediumMemory,
			}
		} else {
			// TODO wrong disk type
		}

		// save pvc name into applications
		if err := r.Update(r.ctx, r.application); err != nil {
			return nil, fmt.Errorf("fail to save PVC name: %s, %s", pvcName, err)
		}

		volumes = append(volumes, coreV1.Volume{
			Name:         pvcName,
			VolumeSource: volumeSource,
		})

		volumeMounts = append(volumeMounts, coreV1.VolumeMount{
			Name:      pvcName,
			MountPath: disk.Path,
		})
	}

	if componentSpec.Configs != nil {
		r.parseComponentConfigs(componentSpec, &volumes, &volumeMounts)
	}

	if len(volumes) > 0 {
		template.Spec.Volumes = volumes
		mainContainer.VolumeMounts = volumeMounts
	}

	err = r.runPlugins(PluginMethodAfterPodTemplateGeneration, componentSpec, template, template)

	if err != nil {
		r.Log.Error(err, "run "+PluginMethodAfterPodTemplateGeneration+" save plugin error")
		return nil, err
	}

	return template, nil

}

func (r *ComponentReconciler) initPluginRuntime(component *corev1alpha1.ComponentSpec) *js.Runtime {
	rt := vm.InitRuntime()

	rt.Set("getApplicationName", func(call js.FunctionCall) js.Value {
		return rt.ToValue(r.application.Name)
	})

	rt.Set("getCurrentComponent", func(call js.FunctionCall) js.Value {
		bts, _ := json.Marshal(component)
		var res map[string]interface{}
		_ = json.Unmarshal(bts, &res)
		return rt.ToValue(res)
	})

	return rt
}

func (r *ComponentReconciler) runPlugins(methodName string, component *corev1alpha1.ComponentSpec, desc interface{}, args ...interface{}) (err error) {
	err = r.runApplicationPlugins(methodName, component, desc, args...)

	if err != nil {
		return err
	}

	err = r.runComponentPlugins(methodName, component, desc, args...)

	if err != nil {
		return err
	}

	return nil
}

func findPluginAndValidateConfigNew(plugin runtime.RawExtension, methodName string, component *corev1alpha1.ComponentSpec) (*PluginProgram, []byte, error) {
	var tmp struct {
		Name   string          `json:"name"`
		Config json.RawMessage `json:"config"`
	}

	_ = json.Unmarshal(plugin.Raw, &tmp)

	pluginProgram := pluginsCache.Get(tmp.Name)

	if pluginProgram == nil {
		return nil, nil, fmt.Errorf("Can't find plugin %s in cache.", tmp.Name)
	}

	if !pluginProgram.Methods[methodName] {
		return nil, nil, nil
	}

	workloadType := component.WorkLoadType

	if workloadType == "" {
		// TODO are we safe to remove this fallback value?
		workloadType = corev1alpha1.WorkloadTypeServer
	}

	if !pluginProgram.AvailableForAllWorkloadTypes && !pluginProgram.AvailableWorkloadTypes[workloadType] {
		return nil, nil, nil
	}

	if pluginProgram.ConfigSchema != nil {
		pluginConfig := gojsonschema.NewStringLoader(string(tmp.Config))
		res, err := pluginProgram.ConfigSchema.Validate(pluginConfig)

		if err != nil {
			return nil, nil, err
		}

		if !res.Valid() {
			return nil, nil, fmt.Errorf(res.Errors()[0].String())
		}
	}

	return pluginProgram, tmp.Config, nil
}

func (r *ComponentReconciler) runComponentPlugins(methodName string, component *corev1alpha1.ComponentSpec, desc interface{}, args ...interface{}) error {
	for _, plugin := range component.PluginsNew {
		pluginProgram, config, err := findPluginAndValidateConfigNew(plugin, methodName, component)

		if err != nil {
			return err
		}

		if pluginProgram == nil {
			continue
		}

		rt := r.initPluginRuntime(component)
		rt.Set("scope", "component")

		err = vm.RunMethod(
			rt,
			pluginProgram.Program,
			methodName,
			config,
			desc,
			args...,
		)

		if err == nil {
			r.savePluginUsing(pluginProgram)
		}
	}

	return nil
}

func (r *ComponentReconciler) runApplicationPlugins(methodName string, component *corev1alpha1.ComponentSpec, desc interface{}, args ...interface{}) error {
	for _, plugin := range r.application.Spec.PluginsNew {
		pluginProgram, config, err := findPluginAndValidateConfigNew(plugin, methodName, component)

		if err != nil {
			return err
		}

		if pluginProgram == nil {
			continue
		}

		rt := r.initPluginRuntime(component)
		rt.Set("scope", "application")

		if pluginProgram.Methods[PluginMethodComponentFilter] {
			shouldExecute := new(bool)

			err := vm.RunMethod(
				rt,
				pluginProgram.Program,
				PluginMethodComponentFilter,
				config,
				shouldExecute,
				component,
			)

			if err != nil {
				return err
			}

			if !*shouldExecute {
				continue
			}
		}

		err = vm.RunMethod(
			rt,
			pluginProgram.Program,
			methodName,
			config,
			desc,
			args...,
		)

		if err == nil {
			r.savePluginUsing(pluginProgram)
		}
	}

	return nil
}

func (r *ComponentReconciler) savePluginUsing(pluginProgram *PluginProgram) (err error) {
	usingName := types.NamespacedName{
		Name:      r.application.Name,
		Namespace: r.application.Namespace,
	}.String()

	var plugin corev1alpha1.Plugin
	// TODO cache the plugin
	err = r.Reader.Get(r.ctx, types.NamespacedName{Name: pluginProgram.Name}, &plugin)

	if err != nil {
		r.Log.Error(err, "can't get plugin")
		return err
	}

	for _, name := range plugin.Status.UsingByApplications {
		if name == usingName {
			return nil
		}
	}

	patchPlugin := plugin.DeepCopy()
	patchPlugin.Status.UsingByApplications = append(plugin.Status.UsingByApplications, usingName)

	return r.Status().Patch(r.ctx, patchPlugin, client.MergeFrom(&plugin))
}

func (r *ComponentReconciler) removePluginUsings() (err error) {
	for _, plugin := range r.application.Spec.PluginsNew {
		r.removePluginUsing(plugin)
	}
	for _, component := range r.application.Spec.Components {
		for _, plugin := range component.PluginsNew {
			r.removePluginUsing(plugin)
		}
	}
	return nil
}

func (r *ComponentReconciler) removePluginUsing(plugin runtime.RawExtension) (err error) {
	var tmp struct {
		Name string `json:"name"`
	}

	_ = json.Unmarshal(plugin.Raw, &tmp)

	pluginProgram := pluginsCache.Get(tmp.Name)

	if pluginProgram == nil {
		return nil
	}

	usingName := types.NamespacedName{
		Name:      r.application.Name,
		Namespace: r.application.Namespace,
	}.String()

	var pluginCRD corev1alpha1.Plugin
	// TODO cache the plugin
	err = r.Reader.Get(r.ctx, types.NamespacedName{Name: pluginProgram.Name}, &pluginCRD)

	if err != nil {
		r.Log.Error(err, "can't get plugin")
		return err
	}

	index := -1
	for i, name := range pluginCRD.Status.UsingByApplications {
		if name == usingName {
			index = i
			break
		}
	}

	if index < 0 {
		return nil
	}

	patchPlugin := pluginCRD.DeepCopy()
	patchPlugin.Status.UsingByApplications = append(patchPlugin.Status.UsingByApplications[:index], patchPlugin.Status.UsingByApplications[index+1:]...)

	return r.Status().Patch(r.ctx, patchPlugin, client.MergeFrom(&pluginCRD))
}

func (r *ComponentReconciler) parseComponentConfigs(component *corev1alpha1.ComponentSpec, volumes *[]coreV1.Volume, volumeMounts *[]coreV1.VolumeMount) {
	var configMap coreV1.ConfigMap

	err := r.Client.Get(r.ctx, types.NamespacedName{
		Name:      files.KAPP_CONFIG_MAP_NAME,
		Namespace: r.component.Namespace,
	}, &configMap)

	if err != nil {
		r.Log.Error(err, "can't get files config-map. Skip configs.")
		return
	}

	// key is mount dir, values is the files
	mountPaths := make(map[string]map[string]bool)

	for _, config := range component.Configs {
		mountPath := config.MountPath

		for _, path := range config.Paths {
			root, err := files.GetFileItemTree(&configMap, path)

			if err != nil {
				r.Log.Error(err, fmt.Sprintf("can't find file item at %s", path))
				continue
			}

			files.ResolveMountPaths(mountPaths, mountPath, root)
		}
	}

	for mountPath, rawFileNamesMap := range mountPaths {
		name := fmt.Sprintf("configs-%x", md5.Sum([]byte(mountPath)))
		items := make([]coreV1.KeyToPath, 0, len(rawFileNamesMap))

		for itemRawFileName := range rawFileNamesMap {

			items = append(items, coreV1.KeyToPath{
				Path: files.GetFileNameFromRawPath(itemRawFileName),
				Key:  files.EncodeFilePath(itemRawFileName),
			})
		}

		volume := coreV1.Volume{
			Name: name,
			VolumeSource: coreV1.VolumeSource{
				ConfigMap: &coreV1.ConfigMapVolumeSource{
					LocalObjectReference: coreV1.LocalObjectReference{
						Name: files.KAPP_CONFIG_MAP_NAME,
					},
					Items: items,
				},
			},
		}

		volumeMount := coreV1.VolumeMount{
			Name:      name,
			MountPath: mountPath,
		}

		*volumes = append(*volumes, volume)
		*volumeMounts = append(*volumeMounts, volumeMount)
	}
}

func (r *ComponentReconciler) getPVC(pvcName string) (*coreV1.PersistentVolumeClaim, error) {
	pvcList := coreV1.PersistentVolumeClaimList{}

	err := r.List(
		r.ctx,
		&pvcList,
		client.InNamespace(r.component.Namespace),
	)
	if err != nil {
		return nil, err
	}

	for _, item := range pvcList.Items {
		if item.Name == pvcName {
			return &item, nil
		}
	}

	return nil, nil
}

func decideAffinityNew(appName string, component *corev1alpha1.ComponentSpec) (*coreV1.Affinity, bool) {
	var nodeSelectorTerms []coreV1.NodeSelectorTerm
	for label, v := range component.NodeSelectorLabels {
		nodeSelectorTerms = append(nodeSelectorTerms, coreV1.NodeSelectorTerm{
			MatchExpressions: []coreV1.NodeSelectorRequirement{
				{
					Key:      label,
					Operator: coreV1.NodeSelectorOpIn,
					Values:   []string{v},
				},
			},
		})
	}

	var nodeAffinity *coreV1.NodeAffinity
	if len(nodeSelectorTerms) > 0 {
		nodeAffinity = &coreV1.NodeAffinity{
			RequiredDuringSchedulingIgnoredDuringExecution: &coreV1.NodeSelector{
				NodeSelectorTerms: nodeSelectorTerms,
			},
		}
	}

	labelsOfThisComponent := getComponentLabels(appName, component.Name)

	var podAffinity *coreV1.PodAffinity
	if component.PodAffinityType == corev1alpha1.PodAffinityTypePreferGather {
		// same
		podAffinity = &coreV1.PodAffinity{
			PreferredDuringSchedulingIgnoredDuringExecution: []coreV1.WeightedPodAffinityTerm{
				{
					Weight: 1,
					PodAffinityTerm: coreV1.PodAffinityTerm{
						TopologyKey: "kubernetes.io/hostname",
						LabelSelector: &metaV1.LabelSelector{
							MatchLabels: labelsOfThisComponent,
						},
					},
				},
			},
		}
	}

	var podAntiAffinity *coreV1.PodAntiAffinity
	if component.PodAffinityType == corev1alpha1.PodAffinityTypePreferFanout {
		podAntiAffinity = &coreV1.PodAntiAffinity{
			PreferredDuringSchedulingIgnoredDuringExecution: []coreV1.WeightedPodAffinityTerm{
				{
					Weight: 1,
					PodAffinityTerm: coreV1.PodAffinityTerm{
						TopologyKey: "kubernetes.io/hostname",
						LabelSelector: &metaV1.LabelSelector{
							MatchLabels: labelsOfThisComponent,
						},
					},
				},
			},
		}
	}

	if nodeAffinity == nil && podAffinity == nil && podAntiAffinity == nil {
		return nil, false
	}

	return &coreV1.Affinity{
		NodeAffinity:    nodeAffinity,
		PodAffinity:     podAffinity,
		PodAntiAffinity: podAntiAffinity,
	}, true
}

func (r *ComponentReconciler) HandleDelete() (err error) {
	if r.component.ObjectMeta.DeletionTimestamp.IsZero() {
		if !util.ContainsString(r.component.ObjectMeta.Finalizers, finalizerName) {
			r.component.ObjectMeta.Finalizers = append(r.component.ObjectMeta.Finalizers, finalizerName)
			if err := r.Update(context.Background(), r.component); err != nil {
				return err
			}
			r.Log.Info("add finalizer", r.component.Namespace, r.component.Name)
		}
	} else {
		if util.ContainsString(r.component.ObjectMeta.Finalizers, finalizerName) {
			// TODO remove resources
			if err := r.DeleteResources(); err != nil {
				return err
			}

			r.component.ObjectMeta.Finalizers = util.RemoveString(r.component.ObjectMeta.Finalizers, finalizerName)
			if err := r.Update(r.ctx, r.component); err != nil {
				return err
			}
		}
	}

	return nil
}

func (r *ComponentReconciler) SetupAttributes(req ctrl.Request) (err error) {
	var component corev1alpha1.Component
	err = r.Reader.Get(r.ctx, req.NamespacedName, &component)

	if err != nil {
		r.Log.Error(err, "Get component error")
		return err
	}
	r.component = &component

	var app corev1alpha1.Application
	err = r.Reader.Get(r.ctx, types.NamespacedName{
		Namespace: "",
		Name:      component.Namespace,
	}, &app)

	if err != nil {
		r.Log.Error(err, "Get application error")
		return err
	}
	r.application = &app
	return nil
}

func (r *ComponentReconciler) DeleteResources() (err error) {
	if r.service != nil {
		if err := r.Client.Delete(r.ctx, r.service); err != nil {
			r.Log.Error(err, "Delete service error")
			return err
		}
	}

	if r.deployment != nil {
		if err := r.DeleteItem(r.deployment); err != nil {
			return err
		}
	}

	if r.daemonSet != nil {
		if err := r.DeleteItem(r.daemonSet); err != nil {
			return err
		}
	}

	if r.cronJob != nil {
		if err := r.DeleteItem(r.cronJob); err != nil {
			return err
		}
	}

	if r.statefulSet != nil {
		if err := r.DeleteItem(r.statefulSet); err != nil {
			return err
		}
	}

	return nil
}

func (r *ComponentReconciler) DeleteItem(obj runtime.Object) (err error) {
	if err := r.Client.Delete(r.ctx, obj); err != nil {
		gvk := obj.GetObjectKind().GroupVersionKind()
		r.Log.Error(err, fmt.Sprintf(" delete item error. Group: %s, Version: %s, Kind: %s", gvk.Group, gvk.Version, gvk.Kind))
		return err
	}

	return nil
}

func (r *ComponentReconciler) LoadResources() (err error) {
	if err := r.LoadService(); err != nil {
		return err
	}

	switch r.component.Spec.WorkLoadType {
	case corev1alpha1.WorkloadTypeServer:
		return r.LoadDeployment()
	case corev1alpha1.WorkloadTypeCronjob:
		return r.LoadCronJob()
	case corev1alpha1.WorkloadTypeDaemonSet:
		return r.LoadDaemonSet()
	case corev1alpha1.WorkloadTypeStatefulSet:
		return r.LoadStatefulSet()
	}

	return nil
}

func (r *ComponentReconciler) LoadService() error {
	if len(r.component.Spec.Ports) > 0 {
		var service coreV1.Service

		if err := r.Reader.Get(
			r.ctx,
			types.NamespacedName{
				Namespace: r.component.Namespace,
				Name:      r.component.Name,
			},
			&service,
		); err != nil {
			r.Log.Error(err, "unable to get service")
			return err
		}

		r.service = &service
	}

	return nil
}

func (r *ComponentReconciler) LoadDeployment() error {
	var deploy appsV1.Deployment
	err := r.LoadItem(&deploy)
	if err != nil {
		return err
	}
	r.deployment = &deploy
	return nil
}

func (r *ComponentReconciler) LoadCronJob() error {
	var cornJob batchV1Beta1.CronJob
	err := r.LoadItem(&cornJob)
	if err != nil {
		return err
	}
	r.cronJob = &cornJob
	return nil
}

func (r *ComponentReconciler) LoadDaemonSet() error {
	var daemonSet appsV1.DaemonSet
	err := r.LoadItem(&daemonSet)
	if err != nil {
		return err
	}
	r.daemonSet = &daemonSet
	return nil
}

func (r *ComponentReconciler) LoadStatefulSet() error {
	var statefulSet appsV1.StatefulSet
	err := r.LoadItem(&statefulSet)
	if err != nil {
		return err
	}
	r.statefulSet = &statefulSet
	return nil
}

func (r *ComponentReconciler) LoadItem(dest runtime.Object) (err error) {
	if err := r.Reader.Get(
		r.ctx,
		types.NamespacedName{
			Namespace: r.component.Namespace,
			Name:      r.component.Name,
		},
		dest,
	); err != nil {
		gvk := dest.GetObjectKind().GroupVersionKind()
		r.Log.Error(err, fmt.Sprintf("unable to get %s %s %s", gvk.Group, gvk.Version, gvk.Kind))
		return err
	}

	return nil
}

func (r *ComponentReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.Component{}).
		Complete(r)
}
