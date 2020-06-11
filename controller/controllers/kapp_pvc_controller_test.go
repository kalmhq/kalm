package controllers

import (
	"context"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"testing"
)

type KappVolumeControllerSuite struct {
	BasicSuite
	ns *coreV1.Namespace
}

func TestKappVolumeControllerSuite(t *testing.T) {
	suite.Run(t, new(KappVolumeControllerSuite))
}

func (suite *KappVolumeControllerSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite()
}

func (suite *KappVolumeControllerSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *KappVolumeControllerSuite) SetupTest() {
	ns := suite.SetupKappEnabledNs()
	suite.ns = &ns
}

func (suite *KappVolumeControllerSuite) TestPVCIsLabeled() {

	ctx := context.Background()

	//var scList v1.StorageClassList
	//err := suite.K8sClient.List(context.TODO(), &scList)
	//fmt.Println("scList:", scList)
	//suite.Nil(err)

	sc := "fake-storage-class"
	pvcName := "pvc-foobar"

	component := generateEmptyComponent(suite.ns.Name)
	component.Spec.Volumes = []v1alpha1.Volume{
		{
			Path:                      "/data",
			Size:                      resource.MustParse("1Mi"),
			Type:                      v1alpha1.VolumeTypePersistentVolumeClaim,
			PersistentVolumeClaimName: pvcName,
			StorageClassName:          &sc,
		},
	}
	suite.createComponent(component)

	//var dp apps1.Deployment
	//suite.Eventually(func() bool {
	//	err := suite.K8sClient.Get(ctx, client.ObjectKey{Namespace: component.Namespace, Name: component.Name}, &dp)
	//	return err == nil
	//})

	var pvc coreV1.PersistentVolumeClaim
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(ctx, client.ObjectKey{
			Namespace: component.Namespace,
			Name:      pvcName,
		}, &pvc)

		return err == nil
	})

	suite.Equal(component.Namespace, pvc.Labels[KappLabelNamespace])
	suite.Equal(component.Name, pvc.Labels[KappLabelComponent])
	suite.Equal("true", pvc.Labels[KappLabelManaged])
}
