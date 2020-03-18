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

	suite.Equal(200, rec.Code)
}

func (suite *ApplicationsHandlerTestSuite) TestCreateEmptyAppliation() {
	body := `{
  "application": {
    "name": "test",
    "namespace": "test",
    "sharedEnvs": [],
    "components": []
  }
}`
	var res resources.ApplicationResponse
	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/applications/test", body)
	rec.BodyAsJSON(&res)

	suite.NotNil(res.Application)
	suite.Equal("test", res.Application.Name)
	suite.Equal("test", res.Application.Namespace)
	suite.Equal(0, len(res.Application.Components))
	suite.Equal(0, len(res.Application.SharedEnvs))
}

func TestApplicationsHanlderTestSuite(t *testing.T) {
	suite.Run(t, new(ApplicationsHandlerTestSuite))
}
