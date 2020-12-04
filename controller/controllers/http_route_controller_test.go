package controllers

import (
	"testing"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	coreV1 "k8s.io/api/core/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type HttpRouteControllerSuite struct {
	BasicSuite
	ns     *coreV1.Namespace
	tenant *v1alpha1.Tenant
}

func (suite *HttpRouteControllerSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite()
	tenant := suite.SetupTenant()

	ns := coreV1.Namespace{
		ObjectMeta: v1.ObjectMeta{
			Name: "test-namespace",
		},
	}

	v1alpha1.SetTenantForObj(&ns, tenant.Name)

	suite.createObject(&ns)
	suite.tenant = tenant
}

func TestRegexp(t *testing.T) {
}

func (suite *HttpRouteControllerSuite) TestCertDomainMatchHost() {
	host := "www.example.com"

	suite.True(certCanBeUsedOnDomain([]string{

		"www.example.com",
	}, host))

	suite.True(certCanBeUsedOnDomain([]string{
		"*.example.com",
	}, host))

	suite.False(certCanBeUsedOnDomain([]string{
		"example.com",
	}, host))

	suite.False(certCanBeUsedOnDomain([]string{
		"*.test.example.com",
	}, host))
}

func (suite *HttpRouteControllerSuite) TestBasicHttpRoute() {
	route := v1alpha1.HttpRoute{
		ObjectMeta: v1.ObjectMeta{
			Name: "test",
		},
		Spec: v1alpha1.HttpRouteSpec{
			Methods: []v1alpha1.HttpRouteMethod{"GET", "POST"},
			Hosts:   []string{"example.com", "example.io"},
			Paths:   []string{"/", "/api"},
			Schemes: []v1alpha1.HttpRouteScheme{"http", "https"},
			Conditions: []v1alpha1.HttpRouteCondition{
				{
					Type:     v1alpha1.HttpRouteConditionTypeHeader,
					Name:     "test-server",
					Operator: v1alpha1.HRCOEqual,
					Value:    "nginx",
				},
				{
					Type:     v1alpha1.HttpRouteConditionTypeHeader,
					Name:     "accept",
					Operator: v1alpha1.HRCOMatchRegexp,
					Value:    "ns/json",
				},
			},
			StripPath: true,
			Destinations: []v1alpha1.HttpRouteDestination{
				{
					Host:   "test:80",
					Weight: 100,
				},
			},
		},
	}

	v1alpha1.SetTenantForObj(&route, suite.tenant.Name)

	suite.createObject(&route)
}

func TestHttpRouteControllerSuite(t *testing.T) {
	suite.Run(t, new(HttpRouteControllerSuite))
}

func TestAdjustWeightToSumTo100(t *testing.T) {
	wSlice := [][]int{
		{1, 1, 6}, // sum([13 13 75]) == 101
		{1, 1, 7},
		{2, 2, 7},
	}

	for _, w := range wSlice {
		rst := adjustWeightToSumTo100(w)
		assert.True(t, 100 == sum(rst))
	}
}
