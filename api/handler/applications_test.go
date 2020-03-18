package handler

import (
	"github.com/kapp-staging/kapp/api/resources"
	"github.com/stretchr/testify/suite"
	"net/http"
	"testing"
)

type ApplicationsHandlerTestSuite struct {
	BasicTestSuite
}

func (suite *ApplicationsHandlerTestSuite) TestGetEmptyList() {
	rec := suite.NewRequest(http.MethodGet, "/v1alpha1/applications", nil)
	var res resources.ApplicationListResponse
	rec.BodyAsJSON(&res)
	suite.Equal(0, len(res.Applications))
}

func TestApplicationsHanlderTestSuite(t *testing.T) {
	suite.Run(t, new(ApplicationsHandlerTestSuite))
}
