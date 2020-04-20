package controllers

import (
	"context"
	"crypto/md5"
	"encoding/json"
	"fmt"
	js "github.com/dop251/goja"
	"github.com/go-logr/logr"
	kappV1Alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
	"github.com/kapp-staging/kapp/lib/files"
	"github.com/kapp-staging/kapp/util"
	"github.com/kapp-staging/kapp/vm"
	"github.com/prometheus/common/log"
	"github.com/sirupsen/logrus"
	"github.com/xeipuuv/gojsonschema"
	appsV1 "k8s.io/api/apps/v1"
	v1 "k8s.io/api/batch/v1"
	batchV1Beta1 "k8s.io/api/batch/v1beta1"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/api/extensions/v1beta1"
	"k8s.io/apimachinery/pkg/api/resource"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/intstr"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"strings"
)

// There will be a new Task instance for each reconciliation
type applicationReconcilerTask struct {
	ctx        context.Context
	reconciler *ApplicationReconciler
	app        *kappV1Alpha1.Application
	req        ctrl.Request
	log        logr.Logger

	deployments []appsV1.Deployment
	cronjobs    []batchV1Beta1.CronJob
	services    []coreV1.Service
}

func newApplicationReconcilerTask(
	reconciler *ApplicationReconciler,
	app *kappV1Alpha1.Application,
	req ctrl.Request,
	log logr.Logger,
) *applicationReconcilerTask {
	return &applicationReconcilerTask{
		context.Background(),
		reconciler,
		app,
		req,
		log,
		[]appsV1.Deployment{},
		[]batchV1Beta1.CronJob{},
		[]coreV1.Service{},
	}
}

func (act *applicationReconcilerTask) Run() (err error) {
	log := act.log

	// handle delete
	if shouldFinishReconcilation, err := act.handleDelete(); err != nil || shouldFinishReconcilation {
		if err != nil {
			log.Error(err, "unable to delete Application")
		}
		return err
	}

	if !act.app.Spec.IsActive {
		return act.deleteExternalResources()
	}

	err = act.getCronjobs()

	if err != nil {
		log.Error(err, "unable to list child conjobs")
		return err
	}

	err = act.getDeployments()

	if err != nil {
		log.Error(err, "unable to list child deployments")
		return err
	}

	err = act.getServices()

	if err != nil {
		log.Error(err, "unable to list child services")
		return err
	}

	err = act.reconcileServices()
	if err != nil {
		log.Error(err, "unable to construct services")
		return err
	}

	err = act.reconcileComponents()

	if err != nil {
		log.Error(err, "unable to construct deployment")
		return err
	}

	return nil
}

func (act *applicationReconcilerTask) reconcileComponents() (err error) {
	for i := range act.app.Spec.Components {
		component := act.app.Spec.Components[i]

		if err = act.reconcileComponent(&component); err != nil {
			return err
		}
	}

	return nil
}

func (act *applicationReconcilerTask) parseComponentConfigs(component *kappV1Alpha1.ComponentSpec, volumes *[]coreV1.Volume, volumeMounts *[]coreV1.VolumeMount) {
	var configMap coreV1.ConfigMap

	err := act.reconciler.Client.Get(act.ctx, types.NamespacedName{
		Name:      files.KAPP_CONFIG_MAP_NAME,
		Namespace: act.app.Namespace,
	}, &configMap)

	if err != nil {
		act.log.Error(err, "can't get files config-map. Skip configs.")
		return
	}

	// key is mount dir, values is the files
	mountPaths := make(map[string]map[string]bool)

	for _, config := range component.Configs {
		mountPath := config.MountPath

		for _, path := range config.Paths {
			root, err := files.GetFileItemTree(&configMap, path)

			if err != nil {
				act.log.Error(err, fmt.Sprintf("can't find file item at %s", path))
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

func (act *applicationReconcilerTask) generatePodTemplateSpec(component *kappV1Alpha1.ComponentSpec) (template *coreV1.PodTemplateSpec, err error) {

	template = &coreV1.PodTemplateSpec{
		ObjectMeta: metaV1.ObjectMeta{
			Labels: getComponentLabels(act.app.Name, component.Name),
		},
		Spec: coreV1.PodSpec{
			Containers: []coreV1.Container{
				{
					Name:    component.Name,
					Image:   component.Image,
					Env:     []coreV1.EnvVar{},
					Command: component.Command,
					Args:    component.Args,
					Resources: coreV1.ResourceRequirements{
						Requests: make(map[coreV1.ResourceName]resource.Quantity),
						Limits:   make(map[coreV1.ResourceName]resource.Quantity),
					},
					ReadinessProbe: component.ReadinessProbe,
					LivenessProbe:  component.LivenessProbe,
				},
			},
		},
	}

	//decide affinity
	if affinity, exist := decideAffinity(act.app.Name, component); exist {
		template.Spec.Affinity = affinity
	}

	mainContainer := &template.Spec.Containers[0]

	// resources
	if component.CPU != nil && !component.CPU.IsZero() {
		mainContainer.Resources.Requests[coreV1.ResourceCPU] = *component.CPU
		mainContainer.Resources.Limits[coreV1.ResourceCPU] = *component.CPU
	}

	if component.Memory != nil && !component.Memory.IsZero() {
		mainContainer.Resources.Limits[coreV1.ResourceMemory] = *component.Memory
		mainContainer.Resources.Limits[coreV1.ResourceMemory] = *component.Memory
	}

	// set image secret
	if act.app.Spec.ImagePullSecretName != "" {
		secs := []coreV1.LocalObjectReference{
			{Name: act.app.Spec.ImagePullSecretName},
		}
		template.Spec.ImagePullSecrets = secs
	}

	// apply envs
	var envs []coreV1.EnvVar
	for _, env := range component.Env {
		var value string

		if env.Type == "" || env.Type == kappV1Alpha1.EnvVarTypeStatic {
			value = env.Value
		} else if env.Type == kappV1Alpha1.EnvVarTypeExternal {
			value, err = act.FindShareEnvValue(env.Value)

			//  if the env can't be found in sharedEnv, ignore it
			if err != nil {
				continue
			}
		} else if env.Type == kappV1Alpha1.EnvVarTypeLinked {
			value, err = act.getValueOfLinkedEnv(env)
			if err != nil {
				return nil, err
			}
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
	for i, disk := range component.Volumes {
		volumeSource := coreV1.VolumeSource{}

		// TODO generate this name at api level
		pvcName := fmt.Sprintf("%s-%s-%x", act.app.Name, component.Name, md5.Sum([]byte(disk.Path)))

		if disk.Type == kappV1Alpha1.VolumeTypePersistentVolumeClaim {
			var pvc *coreV1.PersistentVolumeClaim

			if disk.PersistentVolumeClaimName != "" {
				pvcName = disk.PersistentVolumeClaimName
			}

			pvcFetched, err := act.getPVC(pvcName)

			if err != nil {
				return nil, err
			}

			if pvcFetched != nil {
				pvc = pvcFetched
			} else {
				pvc = &coreV1.PersistentVolumeClaim{
					ObjectMeta: metaV1.ObjectMeta{
						Name:      pvcName,
						Namespace: act.app.Namespace,
						Labels:    getComponentLabels(act.app.Name, component.Name),
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

				if err := act.reconciler.Create(act.ctx, pvc); err != nil {
					return nil, fmt.Errorf("fail to create PVC: %s, %s", pvc.Name, err)
				}

				component.Volumes[i].PersistentVolumeClaimName = pvcName
			}

			volumeSource.PersistentVolumeClaim = &coreV1.PersistentVolumeClaimVolumeSource{
				ClaimName: pvcName,
			}

		} else if disk.Type == kappV1Alpha1.VolumeTypeTemporaryDisk {
			volumeSource.EmptyDir = &coreV1.EmptyDirVolumeSource{
				Medium: coreV1.StorageMediumDefault,
			}
		} else if disk.Type == kappV1Alpha1.VolumeTypeTemporaryMemory {
			volumeSource.EmptyDir = &coreV1.EmptyDirVolumeSource{
				Medium: coreV1.StorageMediumMemory,
			}
		} else {
			// TODO wrong disk type
		}

		// save pvc name into applications
		if err := act.reconciler.Update(act.ctx, act.app); err != nil {
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

	if component.Configs != nil {
		act.parseComponentConfigs(component, &volumes, &volumeMounts)
	}

	if len(volumes) > 0 {
		template.Spec.Volumes = volumes
		mainContainer.VolumeMounts = volumeMounts
	}

	err = act.runPlugins(PluginMethodAfterPodTemplateGeneration, component, template, template)

	if err != nil {
		act.log.Error(err, "run "+PluginMethodAfterPodTemplateGeneration+" save plugin error")
		return nil, err
	}

	return template, nil
}

func decideAffinity(appName string, component *kappV1Alpha1.ComponentSpec) (*coreV1.Affinity, bool) {
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
	if component.PodAffinityType == kappV1Alpha1.PodAffinityTypePreferGather {
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
	if component.PodAffinityType == kappV1Alpha1.PodAffinityTypePreferFanout {
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

func (act *applicationReconcilerTask) reconcileServices() (err error) {
	app := act.app
	ctx := act.ctx
	log := act.log

	for _, component := range act.app.Spec.Components {
		// ports
		service := act.getService(component.Name)

		labels := getComponentLabels(app.Name, component.Name)
		if len(component.Ports) > 0 {
			newService := false
			if service == nil {
				newService = true
				service = &coreV1.Service{
					ObjectMeta: metaV1.ObjectMeta{
						Name:      getServiceName(app.Name, component.Name),
						Namespace: app.Namespace,
						Labels:    labels,
					},
					Spec: coreV1.ServiceSpec{
						Selector: labels,
					},
				}
			}

			var ps []coreV1.ServicePort
			for _, port := range component.Ports {
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

			service.Spec.Ports = ps

			if newService {
				if err := ctrl.SetControllerReference(app, service, act.reconciler.Scheme); err != nil {
					return err
				}

				if err := act.reconciler.Create(ctx, service); err != nil {
					log.Error(err, "unable to create Service for Component", "app", app, "component", component)
					return err
				}
			} else {
				if err := act.reconciler.Update(ctx, service); err != nil {
					log.Error(err, "unable to update Service for Component", "app", app, "component", component)
					return err
				}
			}
		} else if service != nil {
			if err := act.reconciler.Delete(act.ctx, service); err != nil {
				log.Error(err, "unable to delete Service for Application Component", "app", app, "component", component)
				return err
			}
		}
	}

	// refresh services
	err = act.getServices()

	if err != nil {
		log.Error(err, "unable to refresh services")
		return err
	}

	return nil
}

func getComponentLabels(appName, componentName string) map[string]string {
	return map[string]string{
		"kapp-application": appName,
		"kapp-component":   componentName,
	}
}

func (act *applicationReconcilerTask) reconcileComponent(component *kappV1Alpha1.ComponentSpec) (err error) {

	labelMap := getComponentLabels(act.app.Name, component.Name)
	podTemplateSpec, err := act.generatePodTemplateSpec(component)

	if err != nil {
		return err
	}

	switch component.WorkLoadType {
	case kappV1Alpha1.WorkloadTypeServer, "":
		return act.reconcileAsDeployment(component, labelMap, podTemplateSpec)
	case kappV1Alpha1.WorkloadTypeCronjob:
		return act.reconcileAsCronJob(component, labelMap, podTemplateSpec)
	default:
		logrus.Warnln("see unknown WorkLoadType:", component.WorkLoadType)
	}

	return nil
}

func (act *applicationReconcilerTask) getService(componentName string) *coreV1.Service {
	for i, _ := range act.services {
		service := &(act.services[i])

		if service.ObjectMeta.Name == getServiceName(act.app.Name, componentName) {
			return service
		}
	}

	return nil
}

func (act *applicationReconcilerTask) getDeployment(name string) *appsV1.Deployment {
	for i, _ := range act.deployments {
		deployment := &(act.deployments[i])

		if deployment.ObjectMeta.Name == getDeploymentName(act.app.Name, name) {
			return deployment
		}
	}

	return nil
}

func (act *applicationReconcilerTask) getCronjobs() error {
	var cronjobList batchV1Beta1.CronJobList

	if err := act.reconciler.Reader.List(
		act.ctx,
		&cronjobList,
		client.InNamespace(act.req.Namespace),
		client.MatchingLabels{
			"kapp-application": act.app.Name,
		},
	); err != nil {
		act.log.Error(err, "unable to list child deployments")
		return err
	}

	act.cronjobs = cronjobList.Items
	return nil
}

func (act *applicationReconcilerTask) getDeployments() error {
	var deploymentList appsV1.DeploymentList

	if err := act.reconciler.Reader.List(
		act.ctx,
		&deploymentList,
		client.InNamespace(act.req.Namespace),
		client.MatchingLabels{
			"kapp-application": act.app.Name,
		},
	); err != nil {
		act.log.Error(err, "unable to list child deployments")
		return err
	}

	act.deployments = deploymentList.Items

	return nil
}

func (act *applicationReconcilerTask) getServices() error {
	var serviceList coreV1.ServiceList

	if err := act.reconciler.Reader.List(
		act.ctx,
		&serviceList,
		client.InNamespace(act.req.Namespace),
		client.MatchingLabels{
			"kapp-application": act.app.Name,
		},
	); err != nil {
		act.log.Error(err, "unable to list child services")
		return err
	}

	act.services = serviceList.Items

	return nil
}

func (act *applicationReconcilerTask) handleDelete() (shouldFinishReconcilation bool, err error) {
	app := act.app
	ctx := act.ctx

	// examine DeletionTimestamp to determine if object is under deletion
	if app.ObjectMeta.DeletionTimestamp.IsZero() {
		// The object is not being deleted, so if it does not have our finalizer,
		// then lets add the finalizer and update the object. This is equivalent
		// registering our finalizer.
		if !util.ContainsString(app.ObjectMeta.Finalizers, finalizerName) {
			app.ObjectMeta.Finalizers = append(app.ObjectMeta.Finalizers, finalizerName)
			if err := act.reconciler.Update(context.Background(), app); err != nil {
				return true, err
			}
			act.log.Info("add finalizer", app.Namespace, app.Name)
		}
	} else {
		// The object is being deleted
		if util.ContainsString(app.ObjectMeta.Finalizers, finalizerName) {
			// our finalizer is present, so lets handle any external dependency
			if err := act.deleteExternalResources(); err != nil {
				// if fail to delete the external dependency here, return with error
				// so that it can be retried
				return true, err
			}

			// remove our finalizer from the list and update it.
			app.ObjectMeta.Finalizers = util.RemoveString(app.ObjectMeta.Finalizers, finalizerName)
			if err := act.reconciler.Update(ctx, app); err != nil {
				return true, err
			}
		}

		return true, nil
	}

	return false, nil
}

func (act *applicationReconcilerTask) deleteExternalResources() error {
	log := act.log
	ctx := act.ctx

	if err := act.getDeployments(); err != nil {
		log.Error(err, "unable to list child deployments")
		return err
	}

	for _, deployment := range act.deployments {
		log.Info("delete deployment")
		if err := act.reconciler.Delete(ctx, &deployment); err != nil {
			log.Error(err, "delete deployment error")
			return err
		}
	}

	if err := act.getServices(); err != nil {
		log.Error(err, "unable to list services")
		return err
	}

	for _, service := range act.services {
		log.Info("delete service")
		if err := act.reconciler.Delete(ctx, &service); err != nil {
			log.Error(err, "delete service error")
			return err
		}
	}

	if err := act.getCronjobs(); err != nil {
		log.Error(err, "unable to list services")
		return err
	}

	for _, cronjob := range act.cronjobs {
		log.Info("delete cronJob")
		if err := act.reconciler.Delete(ctx, &cronjob); err != nil {
			log.Error(err, "delete service error")
			return err
		}
	}

	act.removePluginUsings()

	log.Info("Delete External Resources Done")

	return nil

}

func (act *applicationReconcilerTask) FindService(componentName string) *coreV1.Service {
	for i := range act.services {
		service := act.services[i]
		if service.Name == getServiceName(act.app.Name, componentName) {
			return &service
		}
	}
	return nil
}

func (act *applicationReconcilerTask) FindShareEnvValue(name string) (string, error) {
	for _, env := range act.app.Spec.SharedEnv {
		if env.Name != name {
			continue
		}

		if env.Type == kappV1Alpha1.EnvVarTypeLinked {
			return act.getValueOfLinkedEnv(env)
		} else if env.Type == "" || env.Type == kappV1Alpha1.EnvVarTypeStatic {
			return env.Value, nil
		}

	}

	return "", fmt.Errorf("fail to find value for shareEnv: %s", name)
}

func (act *applicationReconcilerTask) getPVC(pvcName string) (*coreV1.PersistentVolumeClaim, error) {
	pvcList := coreV1.PersistentVolumeClaimList{}

	err := act.reconciler.List(
		context.TODO(),
		&pvcList,
		client.InNamespace(act.req.Namespace),
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

func (act *applicationReconcilerTask) getValueOfLinkedEnv(env kappV1Alpha1.EnvVar) (string, error) {
	if env.Value == "" {
		return env.Value, nil
	}

	parts := strings.Split(env.Value, "/")
	if len(parts) != 2 {
		return "", fmt.Errorf("wrong componentPort config %s, format error", env.Value)
	}

	service := act.FindService(parts[0])
	if service == nil {
		return "", fmt.Errorf("wrong componentPort config %s, service not exist", env.Value)
	}

	var port int32
	for _, servicePort := range service.Spec.Ports {
		if servicePort.Name == parts[1] {
			port = servicePort.Port
		}
	}

	if port == 0 {
		return "", fmt.Errorf("wrong componentPort config %s, port not exist", env.Value)
	}

	// svc.ns:port
	value := fmt.Sprintf("%s.%s:%d", service.Name, act.app.Namespace, port)

	// <prefix>value<suffix>
	return fmt.Sprintf("%s%s%s", env.Prefix, value, env.Suffix), nil
}

func getDeploymentName(appName, componentName string) string {
	return fmt.Sprintf("%s-%s", appName, componentName)
}

func getServiceName(appName, componentName string) string {
	// a DNS-1035 label must consist of lower case alphanumeric characters or '-',
	// start with an alphabetic character,
	// and end with an alphanumeric character
	// (e.g. 'my-name',  or 'abc-123', regex used for validation is '[a-z]([-a-z0-9]*[a-z0-9])?')

	// Add a prefix to avoid name error
	return fmt.Sprintf("svc-%s-%s", appName, componentName)
}

//func AllIngressPlugins(kapp kappV1Alpha1.Application) (rst []*kappV1Alpha1.PluginIngress) {
//
//	for _, comp := range kapp.Spec.Components {
//		plugins := GetPlugins(kapp.Name, &comp)
//		for _, pluginDef := range comp.Plugins {
//			plugin := kappV1Alpha1.GetPlugin(pluginDef)
//
//			plugin := kappV1Alpha1.GetPlugin(pluginDef)
//
//			switch p := plugin.(type) {
//			case *kappV1Alpha1.PluginIngress:
//				rst = append(rst, p)
//			}
//		}
//	}
//
//	return
//}

func GenRulesOfIngressPlugin(plugin *kappV1Alpha1.PluginIngress) (rst []v1beta1.IngressRule) {

	for _, host := range plugin.Hosts {
		rule := v1beta1.IngressRule{
			Host: host,
			IngressRuleValue: v1beta1.IngressRuleValue{
				HTTP: &v1beta1.HTTPIngressRuleValue{
					Paths: []v1beta1.HTTPIngressPath{
						{
							Path: plugin.Path,
							Backend: v1beta1.IngressBackend{
								ServiceName: plugin.ServiceName,
								ServicePort: intstr.IntOrString{
									Type:   intstr.Int,
									IntVal: int32(plugin.ServicePort),
								},
							},
						},
					},
				},
			},
		}

		rst = append(rst, rule)
	}

	return
}

func GetPlugins(kapp *kappV1Alpha1.Application) (plugins []interface{}) {
	appName := kapp.Name

	for _, componentSpec := range kapp.Spec.Components {
		for _, raw := range componentSpec.Plugins {

			var tmp struct {
				Name string `json:"name"`
				Type string `json:"type"`
			}

			_ = json.Unmarshal(raw.Raw, &tmp)

			if tmp.Name == "manual-scaler" {
				var p kappV1Alpha1.PluginManualScaler
				_ = json.Unmarshal(raw.Raw, &p)
				plugins = append(plugins, &p)
				continue
			}

			switch tmp.Type {
			case pluginIngress:
				var ing kappV1Alpha1.PluginIngress
				_ = json.Unmarshal(raw.Raw, &ing)

				// todo what if not first ports
				ing.ServicePort = int(componentSpec.Ports[0].ServicePort)
				if ing.ServicePort == 0 {
					ing.ServicePort = int(componentSpec.Ports[0].ContainerPort)
				}

				ing.ServiceName = getServiceName(appName, componentSpec.Name)
				ing.Namespace = kapp.Namespace

				plugins = append(plugins, &ing)
				continue
			}
		}
	}

	return
}

func (act *applicationReconcilerTask) initPluginRuntime(component *kappV1Alpha1.ComponentSpec) *js.Runtime {
	rt := vm.InitRuntime()

	rt.Set("getApplicationName", func(call js.FunctionCall) js.Value {
		return rt.ToValue(act.app.Name)
	})

	rt.Set("getCurrentComponent", func(call js.FunctionCall) js.Value {
		bts, _ := json.Marshal(component)
		var res map[string]interface{}
		_ = json.Unmarshal(bts, &res)
		return rt.ToValue(res)
	})

	return rt
}

func (act *applicationReconcilerTask) runPlugins(methodName string, component *kappV1Alpha1.ComponentSpec, desc interface{}, args ...interface{}) (err error) {
	err = act.runApplicationPlugins(methodName, component, desc, args...)

	if err != nil {
		return err
	}

	err = act.runComponentPlugins(methodName, component, desc, args...)

	if err != nil {
		return err
	}

	return nil
}

func findPluginAndValidateConfig(plugin runtime.RawExtension, methodName string, component *kappV1Alpha1.ComponentSpec) (*PluginProgram, []byte, error) {
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
		workloadType = kappV1Alpha1.WorkloadTypeServer
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

func (act *applicationReconcilerTask) runComponentPlugins(methodName string, component *kappV1Alpha1.ComponentSpec, desc interface{}, args ...interface{}) error {
	for _, plugin := range component.PluginsNew {
		pluginProgram, config, err := findPluginAndValidateConfig(plugin, methodName, component)

		if err != nil {
			return err
		}

		if pluginProgram == nil {
			continue
		}

		rt := act.initPluginRuntime(component)
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
			act.savePluginUsing(pluginProgram)
		}
	}

	return nil
}

func (act *applicationReconcilerTask) runApplicationPlugins(methodName string, component *kappV1Alpha1.ComponentSpec, desc interface{}, args ...interface{}) error {
	for _, plugin := range act.app.Spec.PluginsNew {
		pluginProgram, config, err := findPluginAndValidateConfig(plugin, methodName, component)

		if err != nil {
			return err
		}

		if pluginProgram == nil {
			continue
		}

		rt := act.initPluginRuntime(component)
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
			act.savePluginUsing(pluginProgram)
		}
	}

	return nil
}

func (act *applicationReconcilerTask) savePluginUsing(pluginProgram *PluginProgram) (err error) {
	usingName := types.NamespacedName{
		Name:      act.app.Name,
		Namespace: act.app.Namespace,
	}.String()

	var plugin kappV1Alpha1.Plugin
	// TODO cache the plugin
	err = act.reconciler.Reader.Get(act.ctx, types.NamespacedName{Name: pluginProgram.Name}, &plugin)

	if err != nil {
		log.Error(err, "can't get plugin")
		return err
	}

	for _, name := range plugin.Status.UsingByApplications {
		if name == usingName {
			return nil
		}
	}

	patchPlugin := plugin.DeepCopy()
	patchPlugin.Status.UsingByApplications = append(plugin.Status.UsingByApplications, usingName)

	return act.reconciler.Status().Patch(act.ctx, patchPlugin, client.MergeFrom(&plugin))
}

func (act *applicationReconcilerTask) removePluginUsings() (err error) {
	for _, plugin := range act.app.Spec.PluginsNew {
		act.removePluginUsing(plugin)
	}
	for _, component := range act.app.Spec.Components {
		for _, plugin := range component.PluginsNew {
			act.removePluginUsing(plugin)
		}
	}
	return nil
}

func (act *applicationReconcilerTask) removePluginUsing(plugin runtime.RawExtension) (err error) {
	var tmp struct {
		Name string `json:"name"`
	}

	_ = json.Unmarshal(plugin.Raw, &tmp)

	pluginProgram := pluginsCache.Get(tmp.Name)

	if pluginProgram == nil {
		return nil
	}

	usingName := types.NamespacedName{
		Name:      act.app.Name,
		Namespace: act.app.Namespace,
	}.String()

	var pluginCRD kappV1Alpha1.Plugin
	// TODO cache the plugin
	err = act.reconciler.Reader.Get(act.ctx, types.NamespacedName{Name: pluginProgram.Name}, &pluginCRD)

	if err != nil {
		log.Error(err, "can't get plugin")
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

	return act.reconciler.Status().Patch(act.ctx, patchPlugin, client.MergeFrom(&pluginCRD))
}

func GetIngressPlugins(kapp *kappV1Alpha1.Application) (rst []*kappV1Alpha1.PluginIngress) {
	plugins := GetPlugins(kapp)

	for _, plugin := range plugins {
		v, yes := plugin.(*kappV1Alpha1.PluginIngress)

		if !yes {
			continue
		}

		rst = append(rst, v)
	}

	return
}

func (act *applicationReconcilerTask) reconcileAsCronJob(
	component *kappV1Alpha1.ComponentSpec,
	labelMap map[string]string,
	podTemplateSpec *coreV1.PodTemplateSpec,
) error {
	app := act.app
	log := act.log
	ctx := act.ctx

	cj := act.findCronJob(component.Name)

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
			Spec: v1.JobSpec{
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
		if err := ctrl.SetControllerReference(app, cj, act.reconciler.Scheme); err != nil {
			log.Error(err, "unable to set owner for cronJob")
			return err
		}

		if err := act.reconciler.Create(ctx, cj); err != nil {
			log.Error(err, "unable to create CronJob for Application")
			return err
		}

		log.Info("create CronJob " + cj.Name)
	} else {
		if err := act.reconciler.Update(ctx, cj); err != nil {
			log.Error(err, "unable to update CronJob for Application")
			return err
		}

		log.Info("update CronJob:" + cj.Name)
	}

	return nil
}

func (act *applicationReconcilerTask) reconcileAsDeployment(
	component *kappV1Alpha1.ComponentSpec,
	labelMap map[string]string,
	podTemplateSpec *coreV1.PodTemplateSpec,
) error {

	app := act.app
	log := act.log
	ctx := act.ctx

	//todo seem will fail to update if dp changed
	for _, dependency := range component.Dependencies {
		// if dependencies are not ready, simply skip this reconcile
		existDps := act.deployments

		ready := false
		for _, existDp := range existDps {
			dpNameOfDependency := getDeploymentName(app.Name, dependency)
			if dpNameOfDependency != existDp.Name {
				continue
			}

			ready = existDp.Status.ReadyReplicas >= existDp.Status.Replicas
			break
		}

		if !ready {
			// todo or error?
			log.Info("dependency not ready", "component", component.Name, "dependency not ready", dependency)
			return nil
		}
	}

	deployment := act.getDeployment(component.Name)
	isNewDeployment := false

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
		plugin := kappV1Alpha1.GetPlugin(pluginDef)

		switch p := plugin.(type) {
		case *kappV1Alpha1.PluginManualScaler:
			p.Operate(deployment)
		}
	}

	if isNewDeployment {
		if err := ctrl.SetControllerReference(app, deployment, act.reconciler.Scheme); err != nil {
			log.Error(err, "unable to set owner for deployment")
			return err
		}

		if err := act.reconciler.Create(ctx, deployment); err != nil {
			log.Error(err, "unable to create Deployment for Application")
			return err
		}

		log.Info("create Deployment " + deployment.Name)
	} else {
		if err := act.reconciler.Update(ctx, deployment); err != nil {
			log.Error(err, "unable to update Deployment for Application")
			return err
		}

		log.Info("update Deployment " + deployment.Name)
	}

	// apply plugins
	for _, pluginDef := range app.Spec.Components[0].Plugins {
		plugin := kappV1Alpha1.GetPlugin(pluginDef)

		switch p := plugin.(type) {
		case *kappV1Alpha1.PluginManualScaler:
			p.Operate(deployment)
		}
	}

	return act.runPlugins(PluginMethodBeforeDeploymentSave, component, deployment, deployment)
}

func getCronJobName(appName, componentName string) string {
	return fmt.Sprintf("%s-%s", appName, componentName)
}

func (act *applicationReconcilerTask) findCronJob(name string) *batchV1Beta1.CronJob {
	for i := range act.cronjobs {
		cj := &act.cronjobs[i]

		if cj.ObjectMeta.Name == getCronJobName(act.app.Name, name) {
			return cj
		}
	}

	return nil
}
