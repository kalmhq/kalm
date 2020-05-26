package controllers

import (
	"context"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	"istio.io/client-go/pkg/apis/networking/v1beta1"
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
			StripPath:           true,
			HttpRedirectToHttps: true,
			Certification:       "Auto",
			Destinations: []v1alpha1.HttpRouteDestination{
				{
					Host:   "test:80",
					Weight: 100,
				},
			},
		},
	}

	suite.createObject(&route)

	var gateways v1beta1.GatewayList
	suite.Eventually(func() bool {
		suite.Nil(suite.K8sClient.List(context.Background(), &gateways))
		return len(gateways.Items) == 1
	})

	gateway := gateways.Items[0]
	suite.Equal(getHttpRouteHttpGatewayName(route.Name), gateway.Name)

	var virtualServices v1beta1.VirtualServiceList
	suite.Eventually(func() bool {
		suite.Nil(suite.K8sClient.List(context.Background(), &virtualServices))
		return len(virtualServices.Items) == 1
	})

	virtualService := virtualServices.Items[0]
	suite.Equal(route.Name, virtualService.Name)

	// rewrite
	suite.NotNil(virtualService.Spec.Http[0].Rewrite)
	suite.Equal(virtualService.Spec.Http[0].Rewrite.Uri, "/")

	// match
	suite.Len(virtualService.Spec.Http[0].Match, len(route.Spec.Paths)*len(route.Spec.Methods))

	// route
	suite.Len(virtualService.Spec.Http[0].Route, 1)
	suite.Nil(virtualService.Spec.Http[0].Retries)
	suite.Nil(virtualService.Spec.Http[0].Mirror)
	suite.Nil(virtualService.Spec.Http[0].Fault)
	suite.Nil(virtualService.Spec.Http[0].CorsPolicy)
	suite.Nil(virtualService.Spec.Http[0].Timeout)

	//// create cert issuer
	//issuer := genEmptyCAHttpsCertIssuer()
	//suite.createHttpsCertIssuer(issuer)
	//
	//// create cert
	//httpsCert := genHttpsCert(issuer.Name)
	//httpsCert.Spec.Domains = []string{"example.com"}
	//suite.createHttpsCert(httpsCert)
}

func TestHttpRouteControllerSuite(t *testing.T) {
	suite.Run(t, new(HttpRouteControllerSuite))
}
