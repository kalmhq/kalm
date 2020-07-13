package controllers

import (
	"github.com/kalm-staging/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	coreV1 "k8s.io/api/core/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"testing"
)

type HttpRouteControllerSuite struct {
	BasicSuite
	ns *coreV1.Namespace
}

func (suite *HttpRouteControllerSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite()

	ns := coreV1.Namespace{
		ObjectMeta: v1.ObjectMeta{
			Name: "test-namespace",
		},
	}

	suite.createObject(&ns)
	suite.ns = &ns
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
			Name:      "test",
			Namespace: suite.ns.Name,
		},
		Spec: v1alpha1.HttpRouteSpec{
			Methods: []v1alpha1.HttpRouteMethod{"GET", "POST"},
			Hosts:   []string{"example.com", "example.io"},
			Paths:   []string{"/", "/api"},
			Schemes: []string{"http", "https"},
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
