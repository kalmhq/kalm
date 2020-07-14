package controllers

import (
	"context"
	"fmt"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"testing"
)

type KalmVolumeControllerSuite struct {
	BasicSuite
	ns *coreV1.Namespace

	ctx context.Context
}

func TestKalmVolumeControllerSuite(t *testing.T) {
	suite.Run(t, new(KalmVolumeControllerSuite))
}

func (suite *KalmVolumeControllerSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite()
}

func (suite *KalmVolumeControllerSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *KalmVolumeControllerSuite) SetupTest() {
	ns := suite.SetupKalmEnabledNs("")
	suite.ns = &ns

	suite.ctx = context.Background()
}

func (suite *KalmVolumeControllerSuite) TestPVCIsLabeled() {

	sc := "fake-storage-class"
	pvcName := fmt.Sprintf("pvc-foobar-%s", randomName())

	component := generateEmptyComponent(suite.ns.Name)
	component.Spec.Volumes = []v1alpha1.Volume{
		{
			Path:             "/data",
			Size:             resource.MustParse("1Mi"),
			Type:             v1alpha1.VolumeTypePersistentVolumeClaim,
			PVC:              pvcName,
			StorageClassName: &sc,
		},
	}
	suite.createComponent(component)

	var pvc coreV1.PersistentVolumeClaim
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(suite.ctx, client.ObjectKey{
			Namespace: component.Namespace,
			Name:      pvcName,
		}, &pvc)

		return err == nil
	})

	suite.Equal(component.Namespace, pvc.Labels[KalmLabelNamespaceKey])
	suite.Equal(component.Name, pvc.Labels[KalmLabelComponentKey])
	suite.Equal("true", pvc.Labels[KalmLabelManaged])
}

//func (suite *KalmVolumeControllerSuite) TestKalmPVCWithoutActiveComponentWillBeDeleted() {
//
//	sc := "fake-storage-class"
//	pvcName := fmt.Sprintf("pvc-foobar-%s", randomName())
//	pvName := fmt.Sprintf("fake-pv-foobar-%s", randomName())
//
//	pvc := coreV1.PersistentVolumeClaim{
//		ObjectMeta: v1.ObjectMeta{
//			Name:      pvcName,
//			Namespace: suite.ns.Name,
//			Labels: map[string]string{
//				KalmLabelNamespaceKey: suite.ns.Namespace,
//				KalmLabelComponentKey: "comp-not-exist",
//				KalmLabelManaged:   "true",
//			},
//		},
//		Spec: coreV1.PersistentVolumeClaimSpec{
//			StorageClassName: &sc,
//			VolumeName:       pvName,
//			AccessModes:      []coreV1.PersistentVolumeAccessMode{coreV1.ReadWriteOnce},
//			Resources: coreV1.ResourceRequirements{
//				Requests: map[coreV1.ResourceName]resource.Quantity{
//					coreV1.ResourceStorage: resource.MustParse("1Mi"),
//				},
//			},
//		},
//	}
//
//	err := suite.K8sClient.Create(suite.ctx, &pvc)
//	suite.Nil(err)
//
//	suite.Eventually(func() bool {
//		err := suite.K8sClient.Get(suite.ctx, client.ObjectKey{
//			Namespace: pvc.Namespace,
//			Name:      pvc.Name,
//		}, &pvc)
//
//		return errors.IsNotFound(err)
//	})
//}

func (suite *KalmVolumeControllerSuite) TestPVIsLabeledForKalm() {

	sc := "fake-storage-class"
	pvcName := fmt.Sprintf("pvc-foobar-%s", randomName())

	component := generateEmptyComponent(suite.ns.Name)
	component.Spec.Volumes = []v1alpha1.Volume{
		{
			Path:             "/data",
			Size:             resource.MustParse("1Mi"),
			Type:             v1alpha1.VolumeTypePersistentVolumeClaim,
			PVC:              pvcName,
			StorageClassName: &sc,
		},
	}
	suite.createComponent(component)

	var pvc coreV1.PersistentVolumeClaim
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(suite.ctx, client.ObjectKey{
			Namespace: suite.ns.Name,
			Name:      pvcName,
		}, &pvc)

		return err == nil
	})

	// force update of pvc.spec.volumeName for test
	pvName := fmt.Sprintf("pv-foobar-%s", randomName())
	pvc.Spec.VolumeName = pvName
	err := suite.K8sClient.Update(suite.ctx, &pvc)
	suite.Nil(err)

	suite.Eventually(func() bool {
		err = suite.K8sClient.Get(suite.ctx, client.ObjectKey{
			Namespace: suite.ns.Name,
			Name:      pvcName,
		}, &pvc)
		suite.Nil(err)

		return pvc.Spec.VolumeName != ""
	})

	// create pv
	hostPath := coreV1.HostPathVolumeSource{
		Path: "/tmp",
	}

	pv := coreV1.PersistentVolume{
		ObjectMeta: v1.ObjectMeta{
			Name: pvName,
		},
		Spec: coreV1.PersistentVolumeSpec{
			PersistentVolumeReclaimPolicy: coreV1.PersistentVolumeReclaimRetain,
			Capacity: coreV1.ResourceList(map[coreV1.ResourceName]resource.Quantity{
				coreV1.ResourceStorage: resource.MustParse("1Mi"),
			}),
			AccessModes: []coreV1.PersistentVolumeAccessMode{coreV1.ReadWriteOnce},
			PersistentVolumeSource: coreV1.PersistentVolumeSource{
				HostPath: &hostPath,
			},
		},
	}

	err = suite.K8sClient.Create(suite.ctx, &pv)
	suite.Nil(err)

	var pvList coreV1.PersistentVolumeList
	suite.Eventually(func() bool {
		err := suite.K8sClient.List(suite.ctx, &pvList)
		suite.Nil(err)

		suite.Equal(1, len(pvList.Items))

		err = suite.K8sClient.Get(suite.ctx, client.ObjectKey{
			Name: pv.Name,
		}, &pv)
		suite.Nil(err)

		//fmt.Println("pvLabels:", pv.Labels, pv)

		return pv.Labels[KalmLabelNamespaceKey] == pvc.Namespace &&
			pv.Labels[KalmLabelManaged] == "true" &&
			pv.Labels[KalmLabelComponentKey] == component.Name
	})
}
