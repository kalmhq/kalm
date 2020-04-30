package handler

import (
	"github.com/kapp-staging/kapp/api/resources"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	"net/http"
	"testing"
)

type ApplicationsHandlerTestSuite struct {
	WithControllerTestSuite
}

func (suite *ApplicationsHandlerTestSuite) TestGetEmptyList() {
	rec := suite.NewRequest(http.MethodGet, "/v1alpha1/applications", nil)

	var res []resources.ApplicationDetails
	rec.BodyAsJSON(&res)

	suite.Equal(200, rec.Code)
}

func (suite *ApplicationsHandlerTestSuite) TestCreateEmptyApplication() {
	body := `{
    "name": "test",
    "sharedEnvs": [{
      "name": "env1",
      "value": "value1"
    }, {
      "name": "env2",
      "value": "value2",
      "type": "external"
    }]
}`

	var res resources.ApplicationDetails
	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/applications", body)
	rec.BodyAsJSON(&res)

	suite.NotNil(res.Application)
	suite.Equal("test", res.Application.Name)
	suite.Equal(2, len(res.Application.SharedEnvs))

	// empty type should be static
	suite.Equal(v1alpha1.EnvVarTypeStatic, res.Application.SharedEnvs[0].Type)
	suite.Equal(v1alpha1.EnvVarTypeExternal, res.Application.SharedEnvs[1].Type)
}

func (suite *ApplicationsHandlerTestSuite) TestUpdateApplication() {
	body := `{
"name": "test2",
"sharedEnvs": [{
  "name": "env1",
  "value": "value1"
}, {
  "name": "env2",
  "value": "value2",
  "type": "external"
}]
}`
	// create first
	var res resources.ApplicationDetails
	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/applications", body)
	rec.BodyAsJSON(&res)

	suite.NotNil(res.Application)
	suite.Equal("test2", res.Application.Name)
	suite.Equal(2, len(res.Application.SharedEnvs))
	suite.Equal("value1", res.Application.SharedEnvs[0].Value)

	// edit
	body = `{
    "name": "test2",
    "namespace": "test2",
    "sharedEnvs": [{
      "name": "env1",
      "value": "value1-new"
    }]
}`
	rec = suite.NewRequest(http.MethodPut, "/v1alpha1/applications/test2", body)
	rec.BodyAsJSON(&res)
	suite.NotNil(res.Application)
	suite.Equal("test2", res.Application.Name)
	suite.Equal(1, len(res.Application.SharedEnvs))
	suite.Equal("value1-new", res.Application.SharedEnvs[0].Value)
}

func (suite *ApplicationsHandlerTestSuite) TestDeleteApplication() {
	body := `{
    "name": "test3",
    "namespace": "test3",
    "sharedEnvs": [{
      "name": "env1",
      "value": "value1"
    }, {
      "name": "env2",
      "value": "value2",
      "type": "external"
    }]
}`
	// create first
	var res resources.ApplicationDetails
	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/applications", body)
	rec.BodyAsJSON(&res)

	suite.NotNil(res.Application)
	suite.Equal("test3", res.Application.Name)
	suite.Equal(2, len(res.Application.SharedEnvs))
	suite.Equal("value1", res.Application.SharedEnvs[0].Value)

	// delete
	rec = suite.NewRequest(http.MethodDelete, "/v1alpha1/applications/test3", body)
	suite.Equal(http.StatusNoContent, rec.Code)
}

func TestApplicationsHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(ApplicationsHandlerTestSuite))
}
