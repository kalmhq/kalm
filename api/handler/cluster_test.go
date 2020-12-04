package handler

import (
	"net/http"
	"testing"

	"github.com/kalmhq/kalm/api/resources"
	"github.com/stretchr/testify/suite"
)

type ClusterHandlerTestSuite struct {
	WithControllerTestSuite
}

func (suite *ClusterHandlerTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()
	suite.ensureNamespaceExist("kalm-system")
}

func (suite *ClusterHandlerTestSuite) TestClusterInfo() {
	// init cluster info
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterOwnerRole(),
		},
		Method: http.MethodPost,
		Path:   "/v1alpha1/initialize",
		Body:   `{"domain": "kalm.test"}`,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var setupClusterResponse SetupClusterResponse
			rec.BodyAsJSON(&setupClusterResponse)

			suite.NotNil(setupClusterResponse.ClusterInfo)
			suite.Equal("kalm.test", setupClusterResponse.Route.Hosts[0])
		},
	})

	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterViewerRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/cluster",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var clusterInfo ClusterInfo
			rec.BodyAsJSON(&clusterInfo)
			suite.NotNil(&clusterInfo)
		},
	})

	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterViewerRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/httproutes",
		TestWithRoles: func(rec *ResponseRecorder) {
			var routes []*resources.HttpRoute
			rec.BodyAsJSON(&routes)
			suite.NotNil(routes)
			suite.Equal(1, len(routes))
			suite.Equal("kalm-route", routes[0].Name)
		},
	})

	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterOwnerRole(),
		},
		Method: http.MethodPost,
		Path:   "/v1alpha1/reset",
		Body:   `{}`,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(200, rec.Code)
			suite.Equal("", rec.Body.String())

		},
	})

	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterViewerRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/httproutes",
		Body:   `{}`,
		TestWithRoles: func(rec *ResponseRecorder) {
			var routes []*resources.HttpRoute
			rec.BodyAsJSON(&routes)
			rec.BodyAsJSON(&routes)
			suite.NotNil(routes)
			suite.Equal(0, len(routes))
		},
	})
}

func TestClusterHandler(t *testing.T) {
	suite.Run(t, new(ClusterHandlerTestSuite))
}
