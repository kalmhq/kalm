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

type NSWebhookSuite struct {
	BasicSuite
	ns v1.Namespace
}

func TestNSWebhookSuite(t *testing.T) {
	suite.Run(t, new(NSWebhookSuite))
}

func (suite *NSWebhookSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite()

	ns := suite.BasicSuite.SetupKalmEnabledNs()
	suite.ns = ns
}

func (suite *NSWebhookSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *NSWebhookSuite) TestNoTenantError() {
	ns := v1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: randomName(),
			Labels: map[string]string{
				v1alpha1.KalmEnableLabelName: v1alpha1.KalmEnableLabelValue,
			},
		},
	}

	err := suite.K8sClient.Create(context.Background(), &ns)

	suite.NotNil(err)
	suite.Contains(err.Error(), v1alpha1.NoTenantFoundError.Error())
}

func (suite *NSWebhookSuite) TestCRUD() {
	tenantName := suite.ns.Labels[v1alpha1.TenantNameLabelKey]

	ns := v1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: randomName(),
			Labels: map[string]string{
				v1alpha1.TenantNameLabelKey:  tenantName,
				v1alpha1.KalmEnableLabelName: v1alpha1.KalmEnableLabelValue,
			},
		},
	}

	err := suite.K8sClient.Create(context.Background(), &ns)
	suite.Nil(err)

	//check if tenant resource is updated
	suite.Eventually(func() bool {
		var tenant v1alpha1.Tenant
		err := suite.K8sClient.Get(context.Background(), client.ObjectKey{Name: tenantName}, &tenant)
		suite.Nil(err)

		appCnt := tenant.Status.UsedResourceQuota[v1alpha1.ResourceApplicationsCount]
		// fmt.Println("appCnt", appCnt)

		return appCnt.Equal(resource.MustParse("2"))
	})
}
