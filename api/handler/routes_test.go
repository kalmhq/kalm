package handler

import (
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
			Hosts:     []string{"test-routes.test"},
			Paths:     []string{"/"},
			Methods:   []v1alpha1.HttpRouteMethod{"GET"},
			Schemes:   []v1alpha1.HttpRouteScheme{"https"},
			StripPath: false,
			Destinations: []v1alpha1.HttpRouteDestination{
				{
					Host:   "test-routes",
					Weight: 1,
				},
			},
		},
		Name:      "test-routes",
		Namespace: "test-routes",
	}

	// create a route
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodPost,
		Path:   "/v1alpha1/httproutes/test-routes",
		Body:   route,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsMissingRoleError(rec, resources.InsufficientPermissionsError.Error())
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
		Path:   "/v1alpha1/httproutes/test-routes",
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
			Hosts:     []string{"test-routes2.test"},
			Paths:     []string{"/"},
			Methods:   []v1alpha1.HttpRouteMethod{"GET"},
			Schemes:   []v1alpha1.HttpRouteScheme{"https"},
			StripPath: false,
			Destinations: []v1alpha1.HttpRouteDestination{
				{
					Host:   "test-routes",
					Weight: 1,
				},
			},
		},
		Name:      "test-routes",
		Namespace: "test-routes",
	}
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodPut,
		Path:   "/v1alpha1/httproutes/test-routes/test-routes",
		Body:   routeForUpdate,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsMissingRoleError(rec, resources.InsufficientPermissionsError.Error())
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
		Path:   "/v1alpha1/httproutes/test-routes",
		Body:   route,
		TestWithRoles: func(rec *ResponseRecorder) {
			var routesResForUpdate []*resources.HttpRoute
			rec.BodyAsJSON(&routesResForUpdate)
			suite.NotNil(rec)
			suite.EqualValues(1, len(routesResForUpdate))
			suite.EqualValues("test-routes2.test", routesResForUpdate[0].HttpRouteSpec.Hosts[0])
		},
	})

	// delete a route
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodDelete,
		Path:   "/v1alpha1/httproutes/test-routes/test-routes",
		Body:   routeForUpdate,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsMissingRoleError(rec, resources.InsufficientPermissionsError.Error())
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
