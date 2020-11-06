package controllers

import (
	"context"
	"fmt"
	"testing"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
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
	suite.BasicSuite.SetupSuite(true)
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

func (suite *KalmVolumeControllerSuite) TestDeletePVCWillRemoveClaimRefInBoundingPV() {

	sc := "fake-storage-class"
	pvcName := fmt.Sprintf("pvc-foobar-%s", randomName())
	pvName := fmt.Sprintf("fake-pv-foobar-%s", randomName())

	// prepare pv
	hostPath := coreV1.HostPathVolumeSource{Path: "/tmp"}
	pv := coreV1.PersistentVolume{
		ObjectMeta: v1.ObjectMeta{
			Name: pvName,
			Labels: map[string]string{
				KalmLabelManaged: "true",
				KalmLabelPV:      pvName,
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
		},
	}

	err := suite.K8sClient.Create(suite.ctx, &pv)
	suite.Nil(err)

	// create pvc to match previous pv
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
			Selector: &v1.LabelSelector{
				MatchLabels: map[string]string{
					KalmLabelPV: pvName,
				},
			},
			StorageClassName: &sc,
			VolumeName:       pvName,
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

	// clean finalizer of pvc
	pvc.Finalizers = []string{}
	err = suite.K8sClient.Update(suite.ctx, &pvc)
	suite.Nil(err)

	// delete pv to trigger reconciliation
	err = suite.K8sClient.Delete(suite.ctx, &pvc)
	suite.Nil(err)

	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(suite.ctx, client.ObjectKey{
			Namespace: pvc.Namespace,
			Name:      pvc.Name,
		}, &pvc)

		return errors.IsNotFound(err)
	})

	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(suite.ctx, client.ObjectKey{
			Name: pv.Name,
		}, &pv)

		return err == nil && pv.Spec.ClaimRef == nil
	})
}

func (suite *KalmVolumeControllerSuite) TestDeletePVCWillRemovePVWithCleanLabel() {

	sc := "fake-storage-class"
	pvcName := fmt.Sprintf("pvc-foobar-%s", randomName())
	pvName := fmt.Sprintf("fake-pv-foobar-%s", randomName())

	// prepare pv
	hostPath := coreV1.HostPathVolumeSource{Path: "/tmp"}
	pvWithDeleteLabel := coreV1.PersistentVolume{
		ObjectMeta: v1.ObjectMeta{
			Name: pvName,
			Labels: map[string]string{
				KalmLabelManaged:        "true",
				KalmLabelPV:             pvName,
				KalmLabelCleanIfPVCGone: fmt.Sprintf("%s-%s", suite.ns.Name, pvcName),
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
				Namespace: suite.ns.Name,
				Name:      pvcName,
			},
		},
	}

	err := suite.K8sClient.Create(suite.ctx, &pvWithDeleteLabel)
	suite.Nil(err)

	// create pvc to match previous pv
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
			Selector: &v1.LabelSelector{
				MatchLabels: map[string]string{
					KalmLabelPV: pvName,
				},
			},
			StorageClassName: &sc,
			VolumeName:       pvName,
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

	// clean finalizer of pvc
	pvc.Finalizers = []string{}
	err = suite.K8sClient.Update(suite.ctx, &pvc)
	suite.Nil(err)

	// delete pvc to trigger reconciliation
	err = suite.K8sClient.Delete(suite.ctx, &pvc)
	suite.Nil(err)

	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(suite.ctx, client.ObjectKey{
			Namespace: pvc.Namespace,
			Name:      pvc.Name,
		}, &pvc)

		return errors.IsNotFound(err)
	})

	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(suite.ctx, client.ObjectKey{
			Name: pvWithDeleteLabel.Name,
		}, &pvWithDeleteLabel)

		return err == nil &&
			pvWithDeleteLabel.DeletionTimestamp != nil &&
			!pvWithDeleteLabel.DeletionTimestamp.IsZero()
	})
}
