package controllers

import (
	"context"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"testing"
)

type DnsRecordTestSuite struct {
	BasicSuite

	ns  *coreV1.Namespace
	ctx context.Context
}

func (suite *DnsRecordTestSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite(true)
}

func (suite *DnsRecordTestSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *DnsRecordTestSuite) SetupTest() {
	ns := suite.SetupKalmEnabledNs("")
	suite.ns = &ns
	suite.ctx = context.Background()
}

func (suite *PSPSuite) TestCreateDnsRecordWhenCreateTenant() {
	tenant := v1alpha1.Tenant{
		ObjectMeta: v1.ObjectMeta{
			Name: "test-tenant",
		},
		Spec: v1alpha1.TenantSpec{
			TenantDisplayName: "test-tenant",
			Paused:            false,
			ResourceQuota: v1alpha1.ResourceList{
				v1alpha1.ResourceAccessTokensCount: resource.MustParse("100"),
				v1alpha1.ResourceRoleBindingCount:  resource.MustParse("100"),
				v1alpha1.ResourceApplicationsCount: resource.MustParse("100"),
				v1alpha1.ResourceServicesCount:     resource.MustParse("100"),
				v1alpha1.ResourceComponentsCount:   resource.MustParse("100"),
				v1alpha1.ResourceCPU:               resource.MustParse("100"),
				v1alpha1.ResourceMemory:            resource.MustParse("100Gi"),
			},
			Owners: []string{"admin"},
		},
	}

	suite.createObject(&tenant)
}

func TestDnsRecordTestSuite(t *testing.T) {
	suite.Run(t, new(DnsRecordTestSuite))
}
