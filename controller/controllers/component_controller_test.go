package controllers

import (
	"context"
	"fmt"
	"regexp"
	"testing"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	appsV1 "k8s.io/api/apps/v1"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type ComponentControllerSuite struct {
	BasicSuite

	ns  *coreV1.Namespace
	ctx context.Context
}

func (suite *ComponentControllerSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite(true)
}

func (suite *ComponentControllerSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *ComponentControllerSuite) SetupTest() {
	ns := suite.SetupKalmEnabledNs("")
	suite.ns = &ns
	suite.ctx = context.Background()
}

func TestComponentControllerSuite(t *testing.T) {
	suite.Run(t, new(ComponentControllerSuite))
}

func (suite *ComponentControllerSuite) TestComponentBasicCRUD() {
	// create
	component := generateEmptyComponent(suite.ns.Name)

	// mark as global
	if component.Labels == nil {
		component.Labels = make(map[string]string)
	}

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
			len(service.Spec.Ports) == 1 &&
			deployment.Labels["foo"] == "bar" && // label should be set correctly
			deployment.Spec.Template.Labels["foo"] == "bar" && // pod template label should be set correctly
			deployment.Annotations["foo"] == "bar" && // annotation should be set correctly
			deployment.Spec.Template.Annotations["foo"] == "bar" // pod template annotation should be set correctly
	}, "can't get deployment")

	// update deployment env and add a new port
	suite.reloadComponent(component)
	component.Spec.Env = append(component.Spec.Env, v1alpha1.EnvVar{
		Name:  "foo",
		Value: "bar",
		Type:  v1alpha1.EnvVarTypeStatic,
	})
	component.Spec.Ports = append(component.Spec.Ports, v1alpha1.Port{
		ContainerPort: 8822,
		ServicePort:   2233,
		Protocol:      v1alpha1.PortProtocolTCP,
	})

	if component.Labels == nil {
		component.Labels = make(map[string]string)
	}
	component.Labels["foo"] = "bar"

	suite.updateComponent(component) // todo sometimes this line fail the test e.g. https://travis-ci.com/github/kalmhq/kalm/jobs/354813530

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
			len(service.Spec.Ports) == 2 &&
			service.Spec.Selector["foo"] == "bar"
	}, "component update is not working")

	// delete
	suite.reloadComponent(component)
	suite.Nil(suite.K8sClient.Delete(context.Background(), component))

	suite.Eventually(func() bool {
		var deployment appsV1.Deployment
		var service coreV1.Service
		suite.K8sClient.Get(context.Background(), key, &deployment)
		suite.K8sClient.Get(context.Background(), key, &service)

		t1 := isOwner(deployment.OwnerReferences, component.Name, component.TypeMeta.Kind)
		t2 := isOwner(service.OwnerReferences, component.Name, component.TypeMeta.Kind)

		return t1 && t2

	}, "component delete is not working")
}

func (suite *ComponentControllerSuite) TestDaemonSetCRUD() {}

func (suite *ComponentControllerSuite) TestCronJobCRUD() {}

func (suite *ComponentControllerSuite) TestComponentSetControllerRef() {
	plugin := generateEmptyComponentPlugin()
	suite.createComponentPlugin(plugin)

	component := generateEmptyComponent(suite.ns.Name)
	suite.createComponent(component)

	binding := &v1alpha1.ComponentPluginBinding{
		ObjectMeta: metaV1.ObjectMeta{
			Namespace: component.Namespace,
			Name:      fmt.Sprintf("%s-%s", component.Name, plugin.Name),
		},
		Spec: v1alpha1.ComponentPluginBindingSpec{
			PluginName:    plugin.Name,
			ComponentName: component.Name,
			Config:        &runtime.RawExtension{Raw: []byte(`{"replicas": 2}`)},
		},
	}

	suite.Nil(suite.K8sClient.Create(context.Background(), binding))

	suite.Eventually(func() bool {
		suite.K8sClient.Get(suite.ctx, client.ObjectKey{
			Namespace: component.Namespace,
			Name:      fmt.Sprintf("%s-%s", component.Name, plugin.Name),
		}, binding)

		targetOwnerRef := metaV1.OwnerReference{
			UID: component.UID,
		}

		return containsOwnerRef(binding.OwnerReferences, targetOwnerRef)
	})
}

func (suite *ComponentControllerSuite) TestOnlyStaticEnvs() {
	component := generateEmptyComponent(suite.ns.Name)
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

func (suite *ComponentControllerSuite) TestVolumeTemporaryDisk() {
	component := generateEmptyComponent(suite.ns.Name)
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
	component := generateEmptyComponent(suite.ns.Name)
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

func (suite *ComponentControllerSuite) TestKalmEnabled() {
	// create
	component := generateEmptyComponent(suite.ns.Name)
	suite.createComponent(component)

	key := types.NamespacedName{
		Namespace: component.Namespace,
		Name:      component.Name,
	}

	var deployment appsV1.Deployment
	suite.Eventually(func() bool {
		return suite.K8sClient.Get(context.Background(), key, &deployment) == nil
	}, "can't get deployment")

	suite.ns.Labels[KalmEnableLabelName] = "false"
	suite.updateObject(suite.ns)

	suite.Eventually(func() bool {
		return errors.IsNotFound(suite.K8sClient.Get(context.Background(), key, &deployment))
	}, "deployment should be delete when ns is not active")
}

func (suite *ComponentControllerSuite) TestPorts() {
	component := generateEmptyComponent(suite.ns.Name)
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

func (suite *ComponentControllerSuite) getComponentPVCs(component *v1alpha1.Component) []coreV1.PersistentVolumeClaim {
	var pvcList coreV1.PersistentVolumeClaimList
	_ = suite.K8sClient.List(context.Background(), &pvcList, client.MatchingLabels{"kalm-component": component.Name})
	return pvcList.Items
}

func generateEmptyComponent(namespace string, workloadTypeOpt ...v1alpha1.WorkloadType) *v1alpha1.Component {

	workloadType := v1alpha1.WorkloadTypeServer
	if len(workloadTypeOpt) > 0 {
		workloadType = workloadTypeOpt[0]
	}

	name := randomName()[:12]
	component := &v1alpha1.Component{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
		},
		Spec: v1alpha1.ComponentSpec{
			Labels: map[string]string{
				"foo": "bar",
			},
			Annotations: map[string]string{
				"foo": "bar",
			},
			WorkloadType: workloadType,
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
					ContainerPort: 8080,
					ServicePort:   80,
					Protocol:      v1alpha1.PortProtocolTCP,
				},
			},
		},
	}

	return component
}

// pvc not exist, create new pvc
func (suite *ComponentControllerSuite) TestDeploymentUsingNewPVC() {
	pvcName := "pvc-foobar"

	component := generateEmptyComponent(suite.ns.Name)
	component.Spec.Volumes = []v1alpha1.Volume{
		{
			Type: v1alpha1.VolumeTypePersistentVolumeClaim,
			Path: "/test/b",
			Size: resource.MustParse("10m"),
			PVC:  pvcName,
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
			Name:      pvcName,
			Namespace: component.Namespace,
		}, &pvc) == nil
	}, "can't get pvc")

	var deployment appsV1.Deployment
	suite.Eventually(func() bool {
		return suite.K8sClient.Get(context.Background(), key, &deployment) == nil
	}, "can't get deployment")

	// note: in test, pvc won't auto provision pv
	volMount := deployment.Spec.Template.Spec.Containers[0].VolumeMounts[0]
	volume := deployment.Spec.Template.Spec.Volumes[0]
	suite.Equal(volMount.Name, volume.Name)
	suite.Equal(volMount.MountPath, "/test/b")
	suite.Equal(pvcName, pvc.Name)
	suite.Equal(volume.PersistentVolumeClaim.ClaimName, pvc.Name)

	suite.Eventually(func() bool {
		suite.reloadComponent(component)
		return component.Spec.Volumes[0].PVC == pvc.Name
	}, "pvc name not matched")
}

func genPVC(ns string) coreV1.PersistentVolumeClaim {
	pvcName := "pvc-" + randomName()
	sc := "fake-storage-class"

	pvc := coreV1.PersistentVolumeClaim{
		ObjectMeta: metaV1.ObjectMeta{
			Namespace: ns,
			Name:      pvcName,
		},
		Spec: coreV1.PersistentVolumeClaimSpec{
			StorageClassName: &sc,
			AccessModes:      []coreV1.PersistentVolumeAccessMode{coreV1.ReadWriteOnce},
			Resources: coreV1.ResourceRequirements{
				Requests: map[coreV1.ResourceName]resource.Quantity{
					coreV1.ResourceStorage: resource.MustParse("1Mi"),
				},
			},
		},
	}

	return pvc
}

// pvc exist, re-use it
func (suite *ComponentControllerSuite) TestDeploymentReUsePVC() {

	// create pvc ahead, and check if dp can reuse it
	pvc := genPVC(suite.ns.Name)

	err := suite.K8sClient.Create(suite.ctx, &pvc)
	suite.Nil(err)

	// create component and try to re-use this pvc
	component := generateEmptyComponent(suite.ns.Name)
	component.Spec.Volumes = []v1alpha1.Volume{
		{
			Type: v1alpha1.VolumeTypePersistentVolumeClaim,
			Path: "/test/b",
			Size: resource.MustParse("1Mi"),
			PVC:  pvc.Name,
		},
	}
	suite.createComponent(component)

	suite.Eventually(func() bool {
		// check if dp is using this pvc
		key := types.NamespacedName{
			Namespace: component.Namespace,
			Name:      component.Name,
		}

		var dp appsV1.Deployment
		err := suite.K8sClient.Get(suite.ctx, key, &dp)
		if err != nil {
			return false
		}

		vols := dp.Spec.Template.Spec.Volumes
		if len(vols) != 1 {
			return false
		}

		vol := vols[0]

		return vol.PersistentVolumeClaim != nil &&
			vol.PersistentVolumeClaim.ClaimName == pvc.Name
	})
}

// pv exist, delete bounding pvc, and take over the pv
func (suite *ComponentControllerSuite) TestDeploymentReUsePV() {
	suite.T().Skip()
	oldOwningPVC := genPVC(suite.ns.Name)
	err := suite.K8sClient.Create(suite.ctx, &oldOwningPVC)
	suite.Nil(err)

	pv := genPVWithClaimRef(oldOwningPVC)
	err = suite.K8sClient.Create(suite.ctx, &pv)
	suite.Nil(err)

	// try re-use pv which is bound to other oldOwningPVC
	component := generateEmptyComponent(suite.ns.Name)
	newPVCName := "pv-" + randomName()
	component.Spec.Volumes = []v1alpha1.Volume{
		{
			Type:      v1alpha1.VolumeTypePersistentVolumeClaim,
			Path:      "/test/b",
			Size:      resource.MustParse("1Mi"),
			PVC:       newPVCName,
			PVToMatch: pv.Name,
		},
	}
	suite.createComponent(component)

	// check if dp is using new pvc
	suite.Eventually(func() bool {
		var dp appsV1.Deployment
		if err := suite.K8sClient.Get(suite.ctx, types.NamespacedName{
			Namespace: component.Namespace,
			Name:      component.Name,
		}, &dp); err != nil {
			return false
		}

		return len(dp.Spec.Template.Spec.Volumes) == 1 &&
			dp.Spec.Template.Spec.Volumes[0].PersistentVolumeClaim != nil &&
			dp.Spec.Template.Spec.Volumes[0].PersistentVolumeClaim.ClaimName == newPVCName
	})

	// check if oldOwningPVC is deleted
	suite.Eventually(func() bool {
		var pvcDeleted coreV1.PersistentVolumeClaim
		err := suite.K8sClient.Get(suite.ctx, types.NamespacedName{
			Name:      oldOwningPVC.Name,
			Namespace: oldOwningPVC.Namespace,
		}, &pvcDeleted)

		return errors.IsNotFound(err)
	})

	// check if pv's old claimRef is cleaned
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(suite.ctx, types.NamespacedName{
			Name: pv.Name,
		}, &pv)
		suite.Nil(err)

		// in test, bounded pv won't auto set claimRef
		return pv.Spec.ClaimRef == nil
	})
}

// same as above, but for StatefulSet
func (suite *ComponentControllerSuite) TestStatefulSetUsingNewPVC() {
	component := generateEmptyComponent(suite.ns.Name, v1alpha1.WorkloadTypeStatefulSet)

	newPVCName := "pvc-" + randomName()
	component.Spec.Volumes = []v1alpha1.Volume{
		{
			Type: v1alpha1.VolumeTypePersistentVolumeClaimTemplate,
			Path: "/test/b",
			Size: resource.MustParse("1Mi"),
			PVC:  newPVCName,
		},
	}

	err := suite.K8sClient.Create(suite.ctx, component)
	suite.Nil(err)

	// check if sts is created with volClaimTemplate using this pvc
	suite.Eventually(func() bool {
		var sts appsV1.StatefulSet
		err := suite.K8sClient.Get(suite.ctx, types.NamespacedName{
			Namespace: component.Namespace,
			Name:      component.Name,
		}, &sts)
		if err != nil {
			return false
		}

		volClaimTpls := sts.Spec.VolumeClaimTemplates

		return len(volClaimTpls) == 1 &&
			volClaimTpls[0].Name == newPVCName
	})
}

// seems meanless cuz in test, sts volClaimTemplate won't really create pvc
//func (suite *ComponentControllerSuite) TestStatefulSetReUsePVC() {
//	// create pvc ahead, and check if sts can reuse it
//	volClaimTpl := genPVC(suite.ns.Name)
//
//	// create component and try to re-use this pvc
//	component := generateEmptyComponent(suite.ns.Name, v1alpha1.WorkloadTypeStatefulSet)
//	component.Spec.Volumes = []v1alpha1.Volume{
//		{
//			Type: v1alpha1.VolumeTypePersistentVolumeClaim,
//			Path: "/test/b",
//			Size: resource.MustParse("1Mi"),
//			PVC:  volClaimTpl.Name,
//		},
//	}
//
//	// real pvc name is {volClaimTpl}-{stsName}-{0, 1, 2, ...}
//	pvc := volClaimTpl.DeepCopy()
//	pvc.Name = fmt.Sprintf("%s-%s-0", pvc.Name, component.Name)
//	err := suite.K8sClient.Create(suite.ctx, pvc)
//	suite.Nil(err)
//
//	suite.createComponent(component)
//
//	suite.Eventually(func() bool {
//		var sts appsV1.StatefulSet
//		err := suite.K8sClient.Get(suite.ctx, types.NamespacedName{
//			Namespace: component.Namespace,
//			Name:      component.Name,
//		}, &sts)
//		if err != nil {
//			return false
//		}
//
//		volClaimTpls := sts.Spec.VolumeClaimTemplates
//
//		return len(volClaimTpls) == 1 &&
//			volClaimTpls[0].Name == pvc.Name
//	})
//}

func genPVWithClaimRef(pvc coreV1.PersistentVolumeClaim) coreV1.PersistentVolume {

	pv := coreV1.PersistentVolume{
		ObjectMeta: metaV1.ObjectMeta{
			Name: "pv-" + randomName(),
		},
		Spec: coreV1.PersistentVolumeSpec{
			//     apiVersion: v1                                                                                                                                                          │
			//     kind: PersistentVolumeClaim                                                                                                                                             │
			//     name: oldOwningPVC-data                                                                                                                                                          │
			//     namespace: kalm-vols                                                                                                                                                    │
			//     resourceVersion: "8051753"                                                                                                                                              │
			//     uid: a9849600-24bc-4f0e-8bb1-c023e62c7bdd
			ClaimRef: &coreV1.ObjectReference{
				APIVersion: "v1",
				Kind:       "PersistentVolumeClaim",
				Name:       pvc.Name,
				Namespace:  pvc.Namespace,
			},
			PersistentVolumeReclaimPolicy: coreV1.PersistentVolumeReclaimRetain,
			Capacity: coreV1.ResourceList(map[coreV1.ResourceName]resource.Quantity{
				coreV1.ResourceStorage: resource.MustParse("1Mi"),
			}),
			AccessModes: []coreV1.PersistentVolumeAccessMode{coreV1.ReadWriteOnce},
			PersistentVolumeSource: coreV1.PersistentVolumeSource{
				HostPath: &coreV1.HostPathVolumeSource{
					Path: "/data",
				},
			},
		},
	}

	return pv
}

func TestRegexSplit(t *testing.T) {
	command := "-abc \n --c 3 --detf=4\t\n--efd=313"

	space := regexp.MustCompile(`\s+`)
	parts := space.Split(command, -1)

	if len(parts) != 5 {
		t.Fail()
	}
}
