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

type SvcWebhookSuite struct {
	BasicSuite
	ns v1.Namespace
}

func TestSvcWebhookSuite(t *testing.T) {
	suite.Run(t, new(SvcWebhookSuite))
}

func (suite *SvcWebhookSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite()

	ns := suite.BasicSuite.SetupKalmEnabledNs()
	suite.ns = ns
}

func (suite *SvcWebhookSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *SvcWebhookSuite) TestNoTenantError() {
	svc := v1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name:      randomName(),
			Namespace: suite.ns.Name,
		},
		Spec: v1.ServiceSpec{
			Ports: []v1.ServicePort{
				{
					Name: "fake-port",
					Port: 8000,
				},
			},
		},
	}

	err := suite.K8sClient.Create(context.Background(), &svc)

	suite.NotNil(err)
	suite.Contains(err.Error(), v1alpha1.NoTenantFoundError.Error())
}

func (suite *SvcWebhookSuite) TestCRUD() {
	tenantName := suite.ns.Labels[v1alpha1.TenantNameLabelKey]

	svc := v1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name:      randomName(),
			Namespace: suite.ns.Name,
			Labels: map[string]string{
				v1alpha1.TenantNameLabelKey: tenantName,
			},
		},
		Spec: v1.ServiceSpec{
			Ports: []v1.ServicePort{
				{
					Name: "fake-port",
					Port: 8000,
				},
			},
		},
	}

	err := suite.K8sClient.Create(context.Background(), &svc)
	suite.Nil(err)

	//check if tenant resource is updated
	suite.Eventually(func() bool {
		var tenant v1alpha1.Tenant
		err := suite.K8sClient.Get(context.Background(), client.ObjectKey{Name: tenantName}, &tenant)
		suite.Nil(err)

		svcCnt := tenant.Status.UsedResourceQuota[v1alpha1.ResourceServicesCount]

		return svcCnt.Equal(resource.MustParse("1"))
	})
}
