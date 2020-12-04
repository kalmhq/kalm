package handler

import (
	"net/http"
	"testing"

	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
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
			Hosts:     []string{"example.com"},
			Paths:     []string{"/"},
			Methods:   []v1alpha1.HttpRouteMethod{"GET"},
			Schemes:   []v1alpha1.HttpRouteScheme{"https"},
			StripPath: false,
			Destinations: []v1alpha1.HttpRouteDestination{
				{
					Host:   "app.test-routes",
					Weight: 1,
				},
			},
		},
		Name: "test-routes",
	}

	// create a route
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodPost,
		Path:   "/v1alpha1/httproutes",
		Body:   route,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.NotNil(rec)
			suite.EqualValues(201, rec.Code)
		},
	})

	// list route
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/httproutes",
		Body:   route,
		TestWithRoles: func(rec *ResponseRecorder) {
			var routesRes []*resources.HttpRoute
			rec.BodyAsJSON(&routesRes)
			suite.NotNil(rec)
			suite.EqualValues(1, len(routesRes))
			suite.EqualValues("test-routes", routesRes[0].Name)
		},
	})

	// list all routes
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/httproutes",
		Body:   route,
		TestWithRoles: func(rec *ResponseRecorder) {
			var routesRes []*resources.HttpRoute
			rec.BodyAsJSON(&routesRes)
			suite.NotNil(rec)
			suite.EqualValues(1, len(routesRes))
			suite.EqualValues("test-routes", routesRes[0].Name)
		},
	})

	// update a route
	routeForUpdate := resources.HttpRoute{
		HttpRouteSpec: &v1alpha1.HttpRouteSpec{
			Hosts:     []string{"example2.com"},
			Paths:     []string{"/"},
			Methods:   []v1alpha1.HttpRouteMethod{"GET"},
			Schemes:   []v1alpha1.HttpRouteScheme{"https"},
			StripPath: false,
			Destinations: []v1alpha1.HttpRouteDestination{
				{
					Host:   "app.test-routes",
					Weight: 1,
				},
			},
		},
		Name: "test-routes",
	}
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodPut,
		Path:   "/v1alpha1/httproutes/test-routes",
		Body:   routeForUpdate,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.NotNil(rec)
			suite.EqualValues(200, rec.Code)
		},
	})

	// list route
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/httproutes",
		Body:   route,
		TestWithRoles: func(rec *ResponseRecorder) {
			var routesResForUpdate []*resources.HttpRoute
			rec.BodyAsJSON(&routesResForUpdate)
			suite.NotNil(rec)
			suite.EqualValues(1, len(routesResForUpdate))
			suite.EqualValues("example2.com", routesResForUpdate[0].HttpRouteSpec.Hosts[0])
		},
	})

	// delete a route
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodDelete,
		Path:   "/v1alpha1/httproutes/test-routes",
		Body:   routeForUpdate,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.NotNil(rec)
			suite.EqualValues(200, rec.Code)
		},
	})

	// list route
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/httproutes",
		TestWithRoles: func(rec *ResponseRecorder) {
			var routesResForDelete []*resources.HttpRoute
			rec.BodyAsJSON(&routesResForDelete)
			suite.NotNil(rec)
			suite.EqualValues(0, len(routesResForDelete))
		},
	})
}

func TestRoutesHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(RoutesHandlerTestSuite))
}
