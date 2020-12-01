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

type ResCntWebhookSuite struct {
	BasicSuite
	ns v1.Namespace
}

func TestResCntWebhookSuite(t *testing.T) {
	suite.Run(t, new(ResCntWebhookSuite))
}

func (suite *ResCntWebhookSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite()

	ns := suite.BasicSuite.SetupKalmEnabledNs()
	suite.ns = ns
}

func (suite *ResCntWebhookSuite) TestDockerRegistryCnt() {
	tenantName := suite.ns.Labels[v1alpha1.TenantNameLabelKey]

	tenant := v1alpha1.Tenant{}
	err := suite.K8sClient.Get(context.Background(), client.ObjectKey{Name: tenantName}, &tenant)
	suite.Nil(err)

	cnt := tenant.Status.UsedResourceQuota[v1alpha1.ResourceDockerRegistriesCount]
	suite.True(cnt.IsZero())

	dockerRegistry := v1alpha1.DockerRegistry{
		ObjectMeta: metav1.ObjectMeta{
			Name: randomName(),
			Labels: map[string]string{
				v1alpha1.TenantNameLabelKey: tenantName,
			},
		},
		Spec: v1alpha1.DockerRegistrySpec{
			Host: "https://gcr.io",
		},
	}

	err = suite.K8sClient.Create(context.Background(), &dockerRegistry)
	suite.Nil(err)

	suite.Eventually(func() bool {

		err = suite.K8sClient.Get(context.Background(), client.ObjectKey{Name: tenantName}, &tenant)
		suite.Nil(err)

		cnt = tenant.Status.UsedResourceQuota[v1alpha1.ResourceDockerRegistriesCount]
		cntIsOne := cnt.Cmp(resource.MustParse("1")) == 0
		return cntIsOne
	})
}

func (suite *ResCntWebhookSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}
