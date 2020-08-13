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

type KalmPVControllerSuite struct {
	BasicSuite
	ns *coreV1.Namespace

	ctx context.Context
}

func TestKalmPVControllerSuite(t *testing.T) {
	suite.Run(t, new(KalmPVControllerSuite))
}

func (suite *KalmPVControllerSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite()
}

func (suite *KalmPVControllerSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *KalmPVControllerSuite) SetupTest() {
	ns := suite.SetupKalmEnabledNs("")
	suite.ns = &ns

	suite.ctx = context.Background()
}

func (suite *KalmPVControllerSuite) TestPVCleanLabelWorks() {

	// create pv
	pvName := fmt.Sprintf("pv-foobar-%s", randomName())
	hostPath := coreV1.HostPathVolumeSource{
		Path: "/tmp",
	}
	pv := coreV1.PersistentVolume{
		ObjectMeta: v1.ObjectMeta{
			Name: pvName,
			Labels: map[string]string{
				KalmLabelManaged:        "true",
				KalmLabelCleanIfPVCGone: "default-fake-name",
			},
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
			ClaimRef: &coreV1.ObjectReference{
				Namespace: "default",
				Name:      "fake-name",
			},
		},
	}

	err := suite.K8sClient.Create(suite.ctx, &pv)
	suite.Nil(err)

	//create and delete pvc
	pvcName := "pvc-" + randomName()
	sc := "fake-storage-class"

	pvc := coreV1.PersistentVolumeClaim{
		ObjectMeta: v1.ObjectMeta{
			Name:      pvcName,
			Namespace: suite.ns.Name,
			Labels: map[string]string{
				KalmLabelNamespaceKey: suite.ns.Namespace,
				KalmLabelComponentKey: "comp-not-exist",
				KalmLabelManaged:      "true",
			},
		},
		Spec: coreV1.PersistentVolumeClaimSpec{
			StorageClassName: &sc,
			VolumeName:       pvcName,
			AccessModes:      []coreV1.PersistentVolumeAccessMode{coreV1.ReadWriteOnce},
			Resources: coreV1.ResourceRequirements{
				Requests: map[coreV1.ResourceName]resource.Quantity{
					coreV1.ResourceStorage: resource.MustParse("1Mi"),
				},
			},
		},
	}

	err = suite.K8sClient.Create(suite.ctx, &pvc)
	suite.Nil(err)

	suite.Eventually(func() bool {
		err = suite.K8sClient.Get(suite.ctx, client.ObjectKey{
			Name: pvName,
		}, &pv)

		return pv.ObjectMeta.DeletionTimestamp != nil &&
			!pv.ObjectMeta.DeletionTimestamp.IsZero()
	})
}

func (suite *KalmPVControllerSuite) TestPVIsLabeledForKalm() {

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
			// fake cliamRef to bound with PVC
			ClaimRef: &coreV1.ObjectReference{
				Namespace: pvc.Namespace,
				Name:      pvc.Name,
			},
		},
	}

	err = suite.K8sClient.Create(suite.ctx, &pv)
	suite.Nil(err)

	suite.Eventually(func() bool {

		err = suite.K8sClient.Get(suite.ctx, client.ObjectKey{
			Name: pv.Name,
		}, &pv)
		suite.Nil(err)

		return pv.Labels[KalmLabelNamespaceKey] == pvc.Namespace &&
			pv.Labels[KalmLabelManaged] == "true" &&
			pv.Labels[KalmLabelComponentKey] == component.Name
	})
}
