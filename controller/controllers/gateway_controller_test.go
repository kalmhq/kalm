package controllers

import (
	"context"
	"testing"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	"istio.io/client-go/pkg/apis/networking/v1beta1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
)

type GatewayControllerSuite struct {
	BasicSuite
}

func TestGatewayControllerSuite(t *testing.T) {
	suite.Run(t, new(GatewayControllerSuite))
}

func (suite *GatewayControllerSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite(true)
}

func (suite *GatewayControllerSuite) TestBasicHttpRoute() {
	gw := v1beta1.Gateway{}

	// todo, comment out this cuz gateway reconcilation is not guranteed to run

	// suite.Eventually(func() bool {
	// 	suite.K8sClient.Get(context.Background(), types.NamespacedName{
	// 		Name:      "kalm-http-gateway",
	// 		Namespace: "istio-system",
	// 	}, &gw)

	// 	return len(gw.Spec.Servers) == 1
	// })

	route := v1alpha1.HttpRoute{
		ObjectMeta: v1.ObjectMeta{
			Name:      "test",
			Namespace: "default",
		},
		Spec: v1alpha1.HttpRouteSpec{
			Methods:   []v1alpha1.HttpRouteMethod{"GET", "POST"},
			Hosts:     []string{"example.com", "example.io"},
			Paths:     []string{"/", "/api"},
			Schemes:   []v1alpha1.HttpRouteScheme{"http", "https"},
			StripPath: true,
			Destinations: []v1alpha1.HttpRouteDestination{
				{
					Host:   "test:80",
					Weight: 100,
				},
			},
			HttpRedirectToHttps: true,
		},
	}
	suite.createObject(&route)

	// create a route should not change the default http server
	suite.Eventually(func() bool {
		suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Name:      "kalm-http-gateway",
			Namespace: "istio-system",
		}, &gw)

		return len(gw.Spec.Servers) == 1
	})
}
