package handler

import (
	"encoding/json"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	"net/http"
	"testing"
)

type RoutesHandlerTestSuite struct {
	WithControllerTestSuite
}

func (suite *RoutesHandlerTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()
	suite.ensureNamespaceExist("test-routes")
}

func (suite *RoutesHandlerTestSuite) TestRoutesHandler() {
	route := resources.HttpRoute{
		HttpRouteSpec: &v1alpha1.HttpRouteSpec{
			Hosts: []string{"test-routes.test"},
			Paths: []string{"/"},
			Methods: []v1alpha1.HttpRouteMethod{"GET"},
			Schemes: []v1alpha1.HttpRouteScheme{"https"},
			StripPath: false,
			Destinations: []v1alpha1.HttpRouteDestination{
				{
					Host:   "test-routes",
					Weight: 1,
				},
			},
		},
		Name: "test-routes",
		Namespace: "test-routes",
	}
	req, err := json.Marshal(route)
	suite.Nil(err)

	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/httproutes/test-routes", string(req))
	suite.NotNil(rec)
	suite.EqualValues(201, rec.Code)

	// list routes
	var routesRes []*resources.HttpRoute
	rec = suite.NewRequest(http.MethodGet, "/v1alpha1/httproutes/test-routes", "")
	rec.BodyAsJSON(&routesRes)
	suite.NotNil(rec)
	suite.EqualValues(1, len(routesRes))
	suite.EqualValues("test-routes",routesRes[0].Name)

	// list all routes
	var allRoutesRes []*resources.HttpRoute
	rec = suite.NewRequest(http.MethodGet, "/v1alpha1/httproutes", "")
	rec.BodyAsJSON(&allRoutesRes)
	suite.NotNil(rec)
	suite.EqualValues(1, len(allRoutesRes))
	suite.EqualValues("test-routes",allRoutesRes[0].Name)

	// update a route
	routeForUpdate := resources.HttpRoute{
		HttpRouteSpec: &v1alpha1.HttpRouteSpec{
			Hosts: []string{"test-routes2.test"},
			Paths: []string{"/"},
			Methods: []v1alpha1.HttpRouteMethod{"GET"},
			Schemes: []v1alpha1.HttpRouteScheme{"https"},
			StripPath: false,
			Destinations: []v1alpha1.HttpRouteDestination{
				{
					Host:   "test-routes",
					Weight: 1,
				},
			},
		},
		Name: "test-routes",
		Namespace: "test-routes",
	}
	reqForUpdate, err := json.Marshal(routeForUpdate)
	suite.Nil(err)

	rec = suite.NewRequest(http.MethodPut, "/v1alpha1/httproutes/test-routes/test-routes", string(reqForUpdate))
	suite.NotNil(rec)
	suite.EqualValues(200, rec.Code)

	var routesResForUpdate []*resources.HttpRoute
	rec = suite.NewRequest(http.MethodGet, "/v1alpha1/httproutes/test-routes", "")
	rec.BodyAsJSON(&routesResForUpdate)
	suite.NotNil(rec)
	suite.EqualValues(1, len(routesResForUpdate))
	suite.EqualValues("test-routes2.test",routesResForUpdate[0].HttpRouteSpec.Hosts[0])

	// delete a route
	rec = suite.NewRequest(http.MethodDelete, "/v1alpha1/httproutes/test-routes/test-routes", "")
	suite.NotNil(rec)
	suite.EqualValues(200, rec.Code)

	var routesResForDelete []*resources.HttpRoute
	rec = suite.NewRequest(http.MethodGet, "/v1alpha1/httproutes", "")
	rec.BodyAsJSON(&routesResForDelete)
	suite.NotNil(rec)
	suite.EqualValues(0, len(routesResForDelete))
}

func TestRoutesHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(RoutesHandlerTestSuite))
}
