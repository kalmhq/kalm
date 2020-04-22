package controllers

import (
	"context"
	"fmt"
	"github.com/kapp-staging/kapp/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	appsV1 "k8s.io/api/apps/v1"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"testing"
)

type ComponentControllerSuite struct {
	BasicSuite

	application *v1alpha1.Application
}

func (suite *ComponentControllerSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite()
}

func (suite *ComponentControllerSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *ComponentControllerSuite) SetupTest() {
	application := generateEmptyApplication()
	suite.createApplication(application)
	suite.application = application
}

func TestComponentControllerSuite(t *testing.T) {
	suite.Run(t, new(ComponentControllerSuite))
}

func (suite *ComponentControllerSuite) TestComponentBasicCRUD() {
	// create
	component := generateEmptyComponent(suite.application.Name)
	suite.createComponent(component)

	key := types.NamespacedName{
		Namespace: component.Namespace,
		Name:      component.Name,
	}

	// will create a deployment and a service
	suite.Eventually(func() bool {
		var deployment appsV1.Deployment
		var service coreV1.Service

		if err := suite.K8sClient.Get(context.Background(), key, &deployment); err != nil {
			return false
		}

		if err := suite.K8sClient.Get(context.Background(), key, &service); err != nil {
			return false
		}

		return len(deployment.Spec.Template.Spec.Containers[0].Env) == 1 &&
			len(service.Spec.Ports) == 1
	}, "can't get deployment")

	// update deployment env and add a new port
	suite.reloadComponent(component)
	component.Spec.Env = append(component.Spec.Env, v1alpha1.EnvVar{
		Name:  "foo",
		Value: "bar",
		Type:  v1alpha1.EnvVarTypeStatic,
	})
	component.Spec.Ports = append(component.Spec.Ports, v1alpha1.Port{
		Name:          "port2",
		ContainerPort: 8822,
		ServicePort:   2233,
		Protocol:      "TCP",
	})
	suite.updateComponent(component)

	suite.Eventually(func() bool {
		var deployment appsV1.Deployment
		var service coreV1.Service

		if err := suite.K8sClient.Get(context.Background(), key, &deployment); err != nil {
			return false
		}

		if err := suite.K8sClient.Get(context.Background(), key, &service); err != nil {
			return false
		}

		return len(deployment.Spec.Template.Spec.Containers[0].Env) == 2 &&
			len(service.Spec.Ports) == 2
	}, "component update is not working")

	// delete
	suite.reloadComponent(component)
	suite.Nil(suite.K8sClient.Delete(context.Background(), component))

	suite.Eventually(func() bool {
		var deployment appsV1.Deployment
		var service coreV1.Service

		return errors.IsNotFound(suite.K8sClient.Get(context.Background(), key, &deployment)) &&
			errors.IsNotFound(suite.K8sClient.Get(context.Background(), key, &service))

	}, "component delete is not working")
}

func (suite *ComponentControllerSuite) TestOnlyStaticEnvs() {
	component := generateEmptyComponent(suite.application.Name)
	suite.createComponent(component)

	key := types.NamespacedName{
		Namespace: component.Namespace,
		Name:      component.Name,
	}

	var deployment appsV1.Deployment
	suite.Eventually(func() bool { return suite.K8sClient.Get(context.Background(), key, &deployment) == nil }, "can't get deployment")

	suite.Equal(component.Name, deployment.Name)
	suite.Equal(int32(1), *deployment.Spec.Replicas)
	containers := deployment.Spec.Template.Spec.Containers
	suite.Len(containers, 1)
	suite.Len(containers[0].Env, 1)
	suite.Equal("bar", containers[0].Env[0].Value)

	// Update Deployment manually should have no effects eventually
	deployment.Spec.Template.Spec.Containers[0].Env[0].Value = "new-value"
	suite.Nil(suite.K8sClient.Update(context.Background(), &deployment))

	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), key, &deployment)
		return err == nil && deployment.Spec.Template.Spec.Containers[0].Env[0].Value == "bar"
	}, "updated deployment should exist for a long time")

	// Add env
	suite.reloadComponent(component)
	component.Spec.Env = append(component.Spec.Env, v1alpha1.EnvVar{
		Name:  "newName",
		Value: "newValue",
		Type:  v1alpha1.EnvVarTypeStatic,
	})
	suite.updateComponent(component)
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), key, &deployment)
		return err == nil && len(deployment.Spec.Template.Spec.Containers[0].Env) == 2 &&
			deployment.Spec.Template.Spec.Containers[0].Env[1].Value == "newValue"
	}, "should have 2 envs")

	// Update env
	suite.reloadComponent(component)
	component.Spec.Env[1].Value = "newValue2"
	suite.updateComponent(component)
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), key, &deployment)
		return err == nil && len(deployment.Spec.Template.Spec.Containers[0].Env) == 2 &&
			deployment.Spec.Template.Spec.Containers[0].Env[1].Value == "newValue2"
	}, "the second value should be updated")

	// delete envs
	suite.reloadComponent(component)
	component.Spec.Env = component.Spec.Env[:0]
	suite.updateComponent(component)
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), key, &deployment)
		return err == nil && len(deployment.Spec.Template.Spec.Containers[0].Env) == 0
	}, "the second value should be updated")
}

func (suite *ComponentControllerSuite) TestExternalEnv() {
	// create
	suite.application.Spec.SharedEnv = []v1alpha1.EnvVar{
		{
			Name:  "sharedEnv1",
			Value: "value1",
		},
	}
	suite.Nil(suite.K8sClient.Update(context.Background(), suite.application))

	component := generateEmptyComponent(suite.application.Name)
	component.Spec.Env = []v1alpha1.EnvVar{
		{
			Name:  "env1",
			Value: "sharedEnv1",
			Type:  v1alpha1.EnvVarTypeExternal,
		},
	}
	suite.createComponent(component)

	key := types.NamespacedName{
		Namespace: component.Namespace,
		Name:      component.Name,
	}

	var deployment appsV1.Deployment
	suite.Eventually(func() bool { return suite.K8sClient.Get(context.Background(), key, &deployment) == nil }, "can't get deployment")
	suite.Equal(int32(1), *deployment.Spec.Replicas)
	suite.Len(deployment.Spec.Template.Spec.Containers, 1)
	suite.Len(deployment.Spec.Template.Spec.Containers[0].Env, 1)
	suite.Equal(deployment.Spec.Template.Spec.Containers[0].Env[0].Value, "value1")

	// update SharedEnv value should update deployment env value

	suite.reloadApplication(suite.application)
	suite.application.Spec.SharedEnv[0].Value = "value1-new"
	suite.updateApplication(suite.application)
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), key, &deployment)
		if err != nil {
			return false
		}
		mainContainer := deployment.Spec.Template.Spec.Containers[0]
		return len(mainContainer.Env) == 1 &&
			mainContainer.Env[0].Value == "value1-new"
	}, "deployment env is not updated as application env")

	// non-exist external value will be ignore
	suite.reloadApplication(suite.application)
	suite.application.Spec.SharedEnv = suite.application.Spec.SharedEnv[:0] // delete all sharedEnvs
	suite.updateApplication(suite.application)
	suite.Eventually(func() bool {
		if err := suite.K8sClient.Get(context.Background(), key, &deployment); err != nil {
			return false
		}
		return len(deployment.Spec.Template.Spec.Containers[0].Env) == 0
	}, "missing external env value should be ignore")
}

func (suite *ComponentControllerSuite) TestLinkedEnv() {
	// create
	component := generateEmptyComponent(suite.application.Name)
	component.Spec.Env = []v1alpha1.EnvVar{
		{
			Name:  "env1",
			Value: fmt.Sprintf("%s/%s", component.Name, "forlink"),
			Type:  v1alpha1.EnvVarTypeLinked,
		},
	}
	component.Spec.Ports = []v1alpha1.Port{
		{
			Name:          "forlink",
			ContainerPort: 3001,
			ServicePort:   3002,
			Protocol:      "TCP",
		},
	}
	suite.createComponent(component)

	key := types.NamespacedName{
		Namespace: component.Namespace,
		Name:      component.Name,
	}

	var deployment appsV1.Deployment
	suite.Eventually(func() bool { return suite.K8sClient.Get(context.Background(), key, &deployment) == nil }, "can't get deployment")
	suite.Equal(
		fmt.Sprintf("%s.%s:%d", component.Name, component.Namespace, component.Spec.Ports[0].ServicePort),
		deployment.Spec.Template.Spec.Containers[0].Env[0].Value,
	)
}

func (suite *ComponentControllerSuite) TestVolumePVC() {
	component := generateEmptyComponent(suite.application.Name)
	component.Spec.Volumes = []v1alpha1.Volume{
		{
			Type: v1alpha1.VolumeTypePersistentVolumeClaim,
			Path: "/test/b",
			Size: resource.MustParse("10m"),
		},
	}
	key := types.NamespacedName{
		Namespace: component.Namespace,
		Name:      component.Name,
	}
	suite.createComponent(component)
	var pvc coreV1.PersistentVolumeClaim
	suite.Eventually(func() bool {
		return suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Name:      getPVCName(component.Name, component.Spec.Volumes[0].Path),
			Namespace: component.Namespace,
		}, &pvc) == nil
	}, "can't get pvc")

	var deployment appsV1.Deployment
	suite.Eventually(func() bool {
		return suite.K8sClient.Get(context.Background(), key, &deployment) == nil
	}, "can't get deployment")

	mountPath := deployment.Spec.Template.Spec.Containers[0].VolumeMounts[0]
	volume := deployment.Spec.Template.Spec.Volumes[0]
	suite.Equal(mountPath.Name, pvc.Name)
	suite.Equal(mountPath.MountPath, "/test/b")
	suite.Equal(volume.Name, pvc.Name)
	suite.Equal(volume.PersistentVolumeClaim.ClaimName, pvc.Name)

	suite.Eventually(func() bool {
		suite.reloadComponent(component)
		return component.Spec.Volumes[0].PersistentVolumeClaimName == pvc.Name
	}, "pvc name not matched")
}

func (suite *ComponentControllerSuite) TestVolumeTemporaryDisk() {
	component := generateEmptyComponent(suite.application.Name)
	component.Spec.Volumes = []v1alpha1.Volume{
		{
			Type: v1alpha1.VolumeTypeTemporaryDisk,
			Path: "/test/b",
			Size: resource.MustParse("10m"),
		},
	}
	key := types.NamespacedName{
		Namespace: component.Namespace,
		Name:      component.Name,
	}
	suite.createComponent(component)

	var deployment appsV1.Deployment
	suite.Eventually(func() bool {
		return suite.K8sClient.Get(context.Background(), key, &deployment) == nil
	}, "can't get deployment")
	mountPath := deployment.Spec.Template.Spec.Containers[0].VolumeMounts[0]
	volume := deployment.Spec.Template.Spec.Volumes[0]
	suite.Equal("/test/b", mountPath.MountPath)
	suite.Equal(coreV1.StorageMediumDefault, volume.EmptyDir.Medium)

	suite.Eventually(func() bool {
		pvcs := suite.getComponentPVCs(component)
		return len(pvcs) == 0
	}, "temporary disk should not create pvc")
}

func (suite *ComponentControllerSuite) TestVolumeTemporaryMemoryDisk() {
	component := generateEmptyComponent(suite.application.Name)
	component.Spec.Volumes = []v1alpha1.Volume{
		{
			Type: v1alpha1.VolumeTypeTemporaryMemory,
			Path: "/test/b",
			Size: resource.MustParse("10m"),
		},
	}
	key := types.NamespacedName{
		Namespace: component.Namespace,
		Name:      component.Name,
	}
	suite.createComponent(component)

	var deployment appsV1.Deployment
	suite.Eventually(func() bool {
		return suite.K8sClient.Get(context.Background(), key, &deployment) == nil
	}, "can't get deployment")
	mountPath := deployment.Spec.Template.Spec.Containers[0].VolumeMounts[0]
	volume := deployment.Spec.Template.Spec.Volumes[0]
	suite.Equal("/test/b", mountPath.MountPath)
	suite.Equal(coreV1.StorageMediumMemory, volume.EmptyDir.Medium)

	suite.Eventually(func() bool {
		pvcs := suite.getComponentPVCs(component)
		return len(pvcs) == 0
	}, "temporary memory disk should not create pvc")
}

func (suite *ComponentControllerSuite) TestApplicationActive() {
	// create
	component := generateEmptyComponent(suite.application.Name)
	suite.createComponent(component)

	key := types.NamespacedName{
		Namespace: component.Namespace,
		Name:      component.Name,
	}

	var deployment appsV1.Deployment
	suite.Eventually(func() bool { return suite.K8sClient.Get(context.Background(), key, &deployment) == nil }, "can't get deployment")

	suite.application.Spec.IsActive = false
	suite.updateApplication(suite.application)

	suite.Eventually(func() bool { return errors.IsNotFound(suite.K8sClient.Get(context.Background(), key, &deployment)) }, "deployment should be delete when application is not active")
}

func (suite *ComponentControllerSuite) TestPorts() {
	component := generateEmptyComponent(suite.application.Name)
	suite.createComponent(component)
	key := types.NamespacedName{
		Namespace: component.Namespace,
		Name:      component.Name,
	}
	var service coreV1.Service
	suite.Eventually(func() bool { return suite.K8sClient.Get(context.Background(), key, &service) == nil }, "can't get service")
	suite.Len(service.Spec.Ports, 1)
	componentPort := component.Spec.Ports[0]
	servicePort := service.Spec.Ports[0]
	suite.Equal(servicePort.Protocol, componentPort.Protocol)
	suite.Equal(uint32(servicePort.TargetPort.IntValue()), componentPort.ContainerPort)
	suite.Equal(uint32(servicePort.Port), componentPort.ServicePort)

	// update component port
	suite.reloadComponent(component)
	component.Spec.Ports[0].ContainerPort = 3322
	suite.updateComponent(component)
	suite.Eventually(func() bool {
		return suite.K8sClient.Get(context.Background(), key, &service) == nil &&
			service.Spec.Ports[0].TargetPort.IntValue() == 3322
	}, "service port should be updated")

	// Delete component port
	suite.reloadComponent(component)
	component.Spec.Ports = component.Spec.Ports[:0]
	suite.updateComponent(component)
	suite.Eventually(func() bool {
		return errors.IsNotFound(suite.K8sClient.Get(context.Background(), key, &service))
	}, "service should be deleted")
}

func (suite *ComponentControllerSuite) TestAfterTemplateGenerationPlugin() {
	plugin := &v1alpha1.Plugin{
		TypeMeta: metaV1.TypeMeta{
			Kind:       "Plugin",
			APIVersion: "core.kapp.dev/v1alpha1",
		},
		ObjectMeta: metaV1.ObjectMeta{
			Name: randomName()[:12],
		},
		Spec: v1alpha1.PluginSpec{
			Src: `
function addProbesForContainer(container) {
      if (!container.readinessProbe) {
        container.readinessProbe = {};
      }

      container.readinessProbe.httpGet = {
        path: "/",
        port: 80
      };

      container.readinessProbe.initialDelaySeconds = 5;
      container.readinessProbe.timeoutSeconds = 20;
      container.readinessProbe.periodSeconds = 5;
      container.readinessProbe.successThreshold = 1;
      container.readinessProbe.failureThreshold = 3;
    }

    function AfterPodTemplateGeneration(pod) {
      var containers = pod.spec.containers;
      containers.forEach(addProbesForContainer)
      return pod;
    }
`,
			AvailableWorkloadType: []v1alpha1.WorkloadType{},
		},
	}

	suite.Nil(suite.K8sClient.Create(context.Background(), plugin))
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Namespace: plugin.Namespace,
			Name:      plugin.Name,
		}, plugin)

		if err != nil {
			return false
		}

		return plugin.Status.CompiledSuccessfully
	}, "plugin should be compilable")

	component := generateEmptyComponent(suite.application.Name)
	component.Spec.PluginsNew = []runtime.RawExtension{
		{
			Raw: []byte(fmt.Sprintf(`{"name":"%s"}`, plugin.Name)),
		},
	}
	suite.createComponent(component)

	var deployment appsV1.Deployment
	suite.Eventually(func() bool {
		return suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Namespace: component.Namespace,
			Name:      component.Name,
		}, &deployment) == nil &&
			deployment.Spec.Template.Spec.Containers[0].ReadinessProbe != nil &&
			deployment.Spec.Template.Spec.Containers[0].LivenessProbe == nil &&
			deployment.Spec.Template.Spec.Containers[0].ReadinessProbe.TimeoutSeconds == 20
	}, "can't get deployment")
}

func (suite *ComponentControllerSuite) TestBeforeDeploymentSavePlugin() {
	plugin := &v1alpha1.Plugin{
		TypeMeta: metaV1.TypeMeta{
			Kind:       "Plugin",
			APIVersion: "core.kapp.dev/v1alpha1",
		},
		ObjectMeta: metaV1.ObjectMeta{
			Name: randomName()[:12],
		},
		Spec: v1alpha1.PluginSpec{
			Src: `
function BeforeDeploymentSave(deployment) {
    deployment.spec.replicas = 3;
    return deployment;
}
`,
			AvailableWorkloadType: []v1alpha1.WorkloadType{},
		},
	}

	suite.Nil(suite.K8sClient.Create(context.Background(), plugin))
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Namespace: plugin.Namespace,
			Name:      plugin.Name,
		}, plugin)

		if err != nil {
			return false
		}

		return plugin.Status.CompiledSuccessfully
	}, "plugin should be compilable")

	component := generateEmptyComponent(suite.application.Name)
	component.Spec.PluginsNew = []runtime.RawExtension{
		{
			Raw: []byte(fmt.Sprintf(`{"name":"%s"}`, plugin.Name)),
		},
	}
	suite.createComponent(component)

	var deployment appsV1.Deployment
	suite.Eventually(func() bool {
		return suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Namespace: component.Namespace,
			Name:      component.Name,
		}, &deployment) == nil &&
			*deployment.Spec.Replicas == int32(3)
	}, "can't get deployment")
}

func (suite *ComponentControllerSuite) TestAfterTemplateGenerationWithConfigurationPlugin() {
	plugin := &v1alpha1.Plugin{
		TypeMeta: metaV1.TypeMeta{
			Kind:       "Plugin",
			APIVersion: "core.kapp.dev/v1alpha1",
		},
		ObjectMeta: metaV1.ObjectMeta{
			Name: randomName()[:12],
		},
		Spec: v1alpha1.PluginSpec{
			Src: `
function BeforeDeploymentSave(deployment) {
    var config = getConfig();

    if (!config) {
        return;
	}

    deployment.spec.replicas = config.replicas;
    return deployment;
}
`,
			ConfigSchema: &runtime.RawExtension{
				Raw: []byte(`{"type":"object","properties":{"replicas":{"type":"integer"}}}`),
			},
			AvailableWorkloadType: []v1alpha1.WorkloadType{},
		},
	}

	suite.Nil(suite.K8sClient.Create(context.Background(), plugin))
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Namespace: plugin.Namespace,
			Name:      plugin.Name,
		}, plugin)

		if err != nil {
			return false
		}

		return plugin.Status.CompiledSuccessfully
	}, "plugin should be compilable")

	component := generateEmptyComponent(suite.application.Name)
	component.Spec.PluginsNew = []runtime.RawExtension{
		{
			Raw: []byte(fmt.Sprintf(`{"name":"%s","config":{"replicas": 3}}`, plugin.Name)),
		},
	}
	suite.createComponent(component)

	var deployment appsV1.Deployment
	suite.Eventually(func() bool {
		return suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Namespace: component.Namespace,
			Name:      component.Name,
		}, &deployment) == nil &&
			*deployment.Spec.Replicas == int32(3)
	}, "can't get deployment")
}

func (suite *ComponentControllerSuite) reloadComponent(component *v1alpha1.Component) {
	suite.reloadObject(types.NamespacedName{Name: component.Name, Namespace: component.Namespace}, component)
}

func (suite *ComponentControllerSuite) updateComponent(component *v1alpha1.Component) {
	suite.updateObject(component)
}

func (suite *ComponentControllerSuite) createComponent(component *v1alpha1.Component) {
	suite.createObject(component)
}

func (suite *ComponentControllerSuite) reloadApplication(application *v1alpha1.Application) {
	suite.Nil(suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: application.Name}, application))
}

func (suite *ComponentControllerSuite) updateApplication(application *v1alpha1.Application) {
	suite.Nil(suite.K8sClient.Update(context.Background(), application))
}

func (suite *ComponentControllerSuite) createApplication(application *v1alpha1.Application) {
	suite.Nil(suite.K8sClient.Create(context.Background(), application))

	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), getApplicationNamespacedName(application), application)

		if err != nil {
			return false
		}

		for i := range application.Finalizers {
			if application.Finalizers[i] == finalizerName {
				return true
			}
		}

		return false
	}, "Created application has no finalizer.")
}

func (suite *ComponentControllerSuite) getComponentPVCs(component *v1alpha1.Component) []coreV1.PersistentVolumeClaim {
	var pvcList coreV1.PersistentVolumeClaimList
	_ = suite.K8sClient.List(context.Background(), &pvcList, client.MatchingLabels{"kapp-component": component.Name})
	return pvcList.Items
}

func generateEmptyComponent(namespace string) *v1alpha1.Component {
	name := randomName()[:12]
	component := &v1alpha1.Component{
		TypeMeta: metaV1.TypeMeta{
			Kind:       "Application",
			APIVersion: "core.kapp.dev/v1alpha1",
		},
		ObjectMeta: metaV1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
		},
		Spec: v1alpha1.ComponentSpec{
			WorkLoadType: v1alpha1.WorkloadTypeServer, // TODo test default value
			Image:        "nginx:latest",
			Env: []v1alpha1.EnvVar{
				{
					Name:  "foo",
					Value: "bar",
					Type:  v1alpha1.EnvVarTypeStatic,
				},
			},
			Ports: []v1alpha1.Port{
				{
					Name:          "test",
					ContainerPort: 8080,
					ServicePort:   80,
					Protocol:      coreV1.ProtocolTCP,
				},
			},
		},
	}

	return component
}
