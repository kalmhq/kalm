package controllers

import (
	"context"
	"testing"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type PVCWebhookSuite struct {
	BasicSuite
	ns v1.Namespace
}

func TestPVCWebhookSuite(t *testing.T) {
	suite.Run(t, new(PVCWebhookSuite))
}

func (suite *PVCWebhookSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite()

	ns := suite.BasicSuite.SetupKalmEnabledNs()
	suite.ns = ns
}

func (suite *PVCWebhookSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *PVCWebhookSuite) TestNoTenantError() {
	pvc := v1.PersistentVolumeClaim{
		ObjectMeta: metav1.ObjectMeta{
			Name:      randomName(),
			Namespace: suite.ns.Name,
		},
		Spec: v1.PersistentVolumeClaimSpec{
			AccessModes: []v1.PersistentVolumeAccessMode{
				v1.ReadWriteOnce,
			},
			Resources: v1.ResourceRequirements{
				Requests: v1.ResourceList(map[v1.ResourceName]resource.Quantity{
					v1.ResourceStorage: resource.MustParse("1Mi"),
				}),
			},
		},
	}

	err := suite.K8sClient.Create(context.Background(), &pvc)

	suite.NotNil(err)
	suite.Contains(err.Error(), v1alpha1.NoTenantFoundError.Error())
}

func (suite *PVCWebhookSuite) TestCRUD() {
	tenantName := suite.ns.Labels[v1alpha1.TenantNameLabelKey]

	pvc := v1.PersistentVolumeClaim{
		ObjectMeta: metav1.ObjectMeta{
			Name:      randomName(),
			Namespace: suite.ns.Name,
			Labels: map[string]string{
				v1alpha1.TenantNameLabelKey: tenantName,
			},
		},
		Spec: v1.PersistentVolumeClaimSpec{
			AccessModes: []v1.PersistentVolumeAccessMode{
				v1.ReadWriteOnce,
			},
			Resources: v1.ResourceRequirements{
				Requests: v1.ResourceList(map[v1.ResourceName]resource.Quantity{
					v1.ResourceStorage: resource.MustParse("1Mi"),
				}),
			},
		},
	}

	err := suite.K8sClient.Create(context.Background(), &pvc)
	suite.Nil(err)

	//check if tenant resource is updated
	suite.Eventually(func() bool {
		var tenant v1alpha1.Tenant
		err := suite.K8sClient.Get(context.Background(), client.ObjectKey{Name: tenantName}, &tenant)
		suite.Nil(err)

		storage := tenant.Status.UsedResourceQuota[v1alpha1.ResourceStorage]

		return storage.Equal(resource.MustParse("1Mi"))
	})
}
