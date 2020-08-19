package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/stretchr/testify/suite"
	"net/http"
	"testing"
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
	var setupClusterResponse SetupClusterResponse
	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/initialize", `{"domain": "kalm.test"}`)
	rec.BodyAsJSON(&setupClusterResponse)
	suite.NotNil(setupClusterResponse.ClusterInfo)
	suite.Equal("kalm.test", setupClusterResponse.Route.Hosts[0])

	// get cluster info
	var clusterInfo ClusterInfo
	rec = suite.NewRequest(http.MethodGet, "/v1alpha1/cluster", `{}`)
	rec.BodyAsJSON(&clusterInfo)
	suite.NotNil(&clusterInfo)

	var routes []*resources.HttpRoute
	rec = suite.NewRequest(http.MethodGet, "/v1alpha1/httproutes/kalm-system", `{}`)
	rec.BodyAsJSON(&routes)
	suite.NotNil(routes)
	suite.Equal(2, len(routes))
	suite.Equal("kalm-route", routes[0].Name)
	suite.Equal("kalm-webhook-route", routes[1].Name)

	// reset cluster info
	rec = suite.NewRequest(http.MethodPost, "/v1alpha1/reset", `{}`)
	suite.Equal(200, rec.Code)
	suite.Equal("", rec.Body.String())

	rec = suite.NewRequest(http.MethodGet, "/v1alpha1/httproutes/kalm-system", `{}`)
	rec.BodyAsJSON(&routes)
	suite.NotNil(routes)
	suite.Equal(0, len(routes))
}

func TestClusterHandler(t *testing.T) {
	suite.Run(t, new(ClusterHandlerTestSuite))
}
