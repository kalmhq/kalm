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

// test for ../builtin/pod_webhook.go
// located here to reuse BasicSuite in helper_test.go
type PodWebhookSuite struct {
	BasicSuite
	ns v1.Namespace
}

func TestPodWebhookSuite(t *testing.T) {
	suite.Run(t, new(PodWebhookSuite))
}

func (suite *PodWebhookSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite()

	ns := suite.BasicSuite.SetupKalmEnabledNs()
	suite.ns = ns
}

func (suite *PodWebhookSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *PodWebhookSuite) TestNoTenantError() {
	pod := v1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name:      randomName(),
			Namespace: suite.ns.Name,
		},
		Spec: v1.PodSpec{
			Containers: []v1.Container{
				{
					Name:  "fake-name",
					Image: "fake-img",
				},
			},
		},
	}

	err := suite.K8sClient.Create(context.Background(), &pod)

	suite.NotNil(err)
	suite.Contains(err.Error(), v1alpha1.NoTenantFoundError.Error())
}

func (suite *PodWebhookSuite) TestCRUD() {
	tenantName := suite.ns.Labels[v1alpha1.TenantNameLabelKey]

	pod := v1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name:      randomName(),
			Namespace: suite.ns.Name,
			Labels: map[string]string{
				v1alpha1.TenantNameLabelKey: tenantName,
			},
		},
		Spec: v1.PodSpec{
			Containers: []v1.Container{
				{
					Name:  "fake-name",
					Image: "fake-img",
					Resources: v1.ResourceRequirements{
						Limits: map[v1.ResourceName]resource.Quantity{
							v1.ResourceCPU:    resource.MustParse("10m"),
							v1.ResourceMemory: resource.MustParse("10Mi"),
						},
					},
				},
			},
		},
	}

	err := suite.K8sClient.Create(context.Background(), &pod)
	suite.Nil(err)

	//check if tenant resource is updated
	suite.Eventually(func() bool {
		var tenant v1alpha1.Tenant
		err := suite.K8sClient.Get(context.Background(), client.ObjectKey{Name: tenantName}, &tenant)
		suite.Nil(err)

		cpu := tenant.Status.UsedResourceQuota[v1alpha1.ResourceCPU]
		mem := tenant.Status.UsedResourceQuota[v1alpha1.ResourceMemory]

		return cpu.Equal(resource.MustParse("10m")) && mem.Equal(resource.MustParse("10Mi"))
	})
}
