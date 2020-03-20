package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/go-logr/logr"
	kappV1Alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
	"github.com/kapp-staging/kapp/util"
	appsV1 "k8s.io/api/apps/v1"
	batchV1Beta1 "k8s.io/api/batch/v1beta1"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/api/extensions/v1beta1"
	"k8s.io/apimachinery/pkg/api/resource"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
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

func (act *applicationReconcilerTask) generateTemplate(component *kappV1Alpha1.ComponentSpec) (template *coreV1.PodTemplateSpec, err error) {
	mainContainer := &coreV1.Container{
		Name:    component.Name,
		Image:   component.Image,
		Env:     []coreV1.EnvVar{},
		Command: component.Command,
		Args:    component.Args,
		Resources: coreV1.ResourceRequirements{
			Requests: make(map[coreV1.ResourceName]resource.Quantity),
			Limits:   make(map[coreV1.ResourceName]resource.Quantity),
		},
	}

	// resources
	if !component.CPU.IsZero() {
		mainContainer.Resources.Requests[coreV1.ResourceCPU] = component.CPU
		mainContainer.Resources.Limits[coreV1.ResourceCPU] = component.CPU
	}

	if !component.Memory.IsZero() {
		mainContainer.Resources.Limits[coreV1.ResourceMemory] = component.Memory
		mainContainer.Resources.Limits[coreV1.ResourceMemory] = component.Memory
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
			if err != nil {
				return nil, err
			}

			if value == "" {
				// TODO is this the correct way to allocate an error?
				return nil, fmt.Errorf("can't find shared env %s", env.Value)
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

	// Disks
	// make PVCs first
	//act.log.Info("disk config", "component", component.Name)

	path2PVC := make(map[string]*coreV1.PersistentVolumeClaim)
	for _, disk := range component.Disks {
		validNameFromPath := strings.ReplaceAll(disk.Path, "/", "-")
		volName := fmt.Sprintf("vol%s", validNameFromPath)
		pvcName := fmt.Sprintf("%s-%s-%s", act.app.Name, component.Name, volName)

		pvc := &coreV1.PersistentVolumeClaim{
			ObjectMeta: metaV1.ObjectMeta{
				Name:      pvcName,
				Namespace: act.app.Namespace,
			},
			Spec: coreV1.PersistentVolumeClaimSpec{
				AccessModes: []coreV1.PersistentVolumeAccessMode{coreV1.ReadWriteOnce},
				Resources: coreV1.ResourceRequirements{
					Requests: coreV1.ResourceList{
						coreV1.ResourceStorage: disk.Size,
					},
				},
				StorageClassName: nil,
			},
		}

		pvcExist, err := act.IsPVCExists(pvc.Name)
		if err != nil {
			return nil, err
		}
		if !pvcExist {
			if err := act.reconciler.Create(act.ctx, pvc); err != nil {
				return nil, fmt.Errorf("fail to create PVC: %s, %s", pvc.Name, err)
			} else {
				act.log.Info("create pvc", "name", pvc.Name)
			}
		}
		//todo how to update PVC?

		path2PVC[disk.Path] = pvc
	}

	// add volumes & volumesMounts
	var volumes []coreV1.Volume
	var volumeMounts []coreV1.VolumeMount
	for _, disk := range component.Disks {
		pvc := path2PVC[disk.Path]

		volumes = append(volumes, coreV1.Volume{
			Name: pvc.Name,
			VolumeSource: coreV1.VolumeSource{
				PersistentVolumeClaim: &coreV1.PersistentVolumeClaimVolumeSource{
					ClaimName: pvc.Name,
				},
			},
		})

		volumeMounts = append(volumeMounts, coreV1.VolumeMount{
			Name:      pvc.Name,
			MountPath: disk.Path,
		})
	}

	if len(volumes) > 0 {
		template.Spec.Volumes = volumes
		mainContainer.VolumeMounts = volumeMounts
	}

	/*	// before start
		var beforeHooks []coreV1.Container
		for i, beforeHook := range component.BeforeStart {
			beforeHooks = append(beforeHooks, coreV1.Container{
				Image:   component.Image,
				Name:    fmt.Sprintf("%s-before-hook-%d", component.Name, i),
				Command: []string{"/bin/sh"}, // TODO: when to use /bin/bash ??
				Args: []string{
					"-c",
					beforeHook,
				},
				Env: envs,
			})
		}
		deployment.Spec.Template.Spec.InitContainers = beforeHooks

		// after start
		if len(component.AfterStart) == 0 {
			if mainContainer.Lifecycle != nil {
				mainContainer.Lifecycle.PostStart = nil
			}
		} else {
			if mainContainer.Lifecycle == nil {
				mainContainer.Lifecycle = &coreV1.Lifecycle{}
			}

			mainContainer.Lifecycle.PostStart = &coreV1.Handler{
				Exec: &coreV1.ExecAction{
					Command: []string{
						"/bin/sh",
						"-c",
						strings.Join(component.AfterStart, " && "),
					},
				},
			}
		}*/

	// before stop
	//if len(component.BeforeDestroy) == 0 {
	//	if mainContainer.Lifecycle != nil {
	//		mainContainer.Lifecycle.PreStop = nil
	//	}
	//} else {
	//	if mainContainer.Lifecycle == nil {
	//		mainContainer.Lifecycle = &coreV1.Lifecycle{}
	//	}
	//
	//	mainContainer.Lifecycle.PreStop = &coreV1.Handler{
	//		Exec: &coreV1.ExecAction{
	//			Command: []string{
	//				"/bin/sh",
	//				"-c",
	//				strings.Join(component.BeforeDestroy, " && "),
	//			},
	//		},
	//	}
	//}
	template = &coreV1.PodTemplateSpec{
		ObjectMeta: metaV1.ObjectMeta{
			Labels: getComponentLabels(act.app.Name, component.Name),
		},
		Spec: coreV1.PodSpec{
			Containers: []coreV1.Container{
				*mainContainer,
			},
			//Volumes: act.app.Spec.Volumes,
		},
	}

	return template, nil
}

func (act *applicationReconcilerTask) reconcileServices() (err error) {
	app := act.app
	ctx := act.ctx
	log := act.log

	for _, component := range act.app.Spec.Components {
		// ports
		service := act.getService(component.Name)
		if len(component.Ports) > 0 {
			newService := false
			if service == nil {
				newService = true
				service = &coreV1.Service{
					ObjectMeta: metaV1.ObjectMeta{
						Name:      getServiceName(app.Name, component.Name),
						Namespace: app.Namespace,
					},
					Spec: coreV1.ServiceSpec{
						Selector: map[string]string{
							"application": app.Name,
							"component":   component.Name,
						},
					},
				}
			}

			ps := []coreV1.ServicePort{}

			for _, port := range component.Ports {
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
	app := act.app
	log := act.log
	ctx := act.ctx

	labelMap := getComponentLabels(act.app.Name, component.Name)
	deployment := act.getDeployment(component.Name)
	template, err := act.generateTemplate(component)

	if err != nil {
		return err
	}

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

	newDeployment := false

	if deployment == nil {
		newDeployment = true

		deployment = &appsV1.Deployment{
			ObjectMeta: metaV1.ObjectMeta{
				Labels:      labelMap,
				Annotations: make(map[string]string),
				Name:        getDeploymentName(app.Name, component.Name),
				Namespace:   app.Namespace,
			},
			Spec: appsV1.DeploymentSpec{
				Template: *template,
				Selector: &metaV1.LabelSelector{
					MatchLabels: labelMap,
				},
			},
		}
	} else {
		deployment.Spec.Template = *template
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

	if newDeployment {
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

	if err := act.reconciler.List(
		act.ctx,
		&cronjobList,
		client.InNamespace(act.req.Namespace),
		client.MatchingFields{
			ownerKey: act.req.Name,
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

	if err := act.reconciler.List(
		act.ctx,
		&serviceList,
		client.InNamespace(act.req.Namespace),
		client.MatchingFields{
			ownerKey: act.req.Name,
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

func (act *applicationReconcilerTask) IsPVCExists(pvcName string) (bool, error) {
	pvcList := coreV1.PersistentVolumeClaimList{}

	err := act.reconciler.List(
		context.TODO(),
		&pvcList,
		client.InNamespace(act.req.Namespace),
	)
	if err != nil {
		return false, err
	}

	for _, item := range pvcList.Items {
		if item.Name == pvcName {
			return true, nil
		}
	}

	return false, nil
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
	return fmt.Sprintf("%s-%s", appName, componentName)
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
							//Path: "",
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
			case "plugins.core.kapp.dev/v1alpha1.ingress":
				var ing kappV1Alpha1.PluginIngress
				_ = json.Unmarshal(raw.Raw, &ing)

				// todo what if not first ports
				ing.ServicePort = int(componentSpec.Ports[0].ServicePort)
				ing.ServiceName = getServiceName(appName, componentSpec.Name)
				ing.Namespace = kapp.Namespace

				plugins = append(plugins, &ing)
				continue
			}
		}
	}

	return
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
