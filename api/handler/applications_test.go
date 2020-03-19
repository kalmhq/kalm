package handler

import (
	"github.com/kapp-staging/kapp/api/resources"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
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
    "sharedEnvs": [{
      "name": "env1",
      "value": "value1"
    }, {
      "name": "env2",
      "value": "value2",
      "type": "external"
    }],
    "components": [{
      "name": "web",
      "image": "busybox",
      "env": [{
      	"name": "componentEnv1",
      	"value": "value1"
      }, {
      	"name": "componentEnv2",
      	"value": "value2",
      	"type": "external"
      }]
    }]
  }
}`

	var res resources.ApplicationResponse
	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/applications/test", body)
	rec.BodyAsJSON(&res)

	suite.NotNil(res.Application)
	suite.Equal("test", res.Application.Name)
	suite.Equal("test", res.Application.Namespace)

	suite.Equal(2, len(res.Application.SharedEnvs))

	// empty type should be static
	suite.Equal(v1alpha1.EnvVarTypeStatic, res.Application.SharedEnvs[0].Type)
	suite.Equal(v1alpha1.EnvVarTypeExternal, res.Application.SharedEnvs[1].Type)

	suite.Equal(1, len(res.Application.Components))
	suite.Equal(v1alpha1.EnvVarTypeStatic, res.Application.Components[0].Env[0].Type)
	suite.Equal(v1alpha1.EnvVarTypeExternal, res.Application.Components[0].Env[1].Type)
}

func (suite *ApplicationsHandlerTestSuite) TestUpdateAppliation() {
	body := `{
  "application": {
    "name": "test2",
    "namespace": "test2",
    "sharedEnvs": [{
      "name": "env1",
      "value": "value1"
    }, {
      "name": "env2",
      "value": "value2",
      "type": "external"
    }],
    "components": []
  }
}`
	// create first
	var res resources.ApplicationResponse
	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/applications/test2", body)
	rec.BodyAsJSON(&res)

	suite.NotNil(res.Application)
	suite.Equal("test2", res.Application.Name)
	suite.Equal("test2", res.Application.Namespace)
	suite.Equal(2, len(res.Application.SharedEnvs))
	suite.Equal("value1", res.Application.SharedEnvs[0].Value)

	// edit
	body = `{
  "application": {
    "name": "test2",
    "namespace": "test2",
    "sharedEnvs": [{
      "name": "env1",
      "value": "value1-new"
    }],
    "components": []
  }
}`
	rec = suite.NewRequest(http.MethodPut, "/v1alpha1/applications/test2/test2", body)
	rec.BodyAsJSON(&res)
	suite.NotNil(res.Application)
	suite.Equal("test2", res.Application.Name)
	suite.Equal("test2", res.Application.Namespace)
	suite.Equal(1, len(res.Application.SharedEnvs))
	suite.Equal("value1-new", res.Application.SharedEnvs[0].Value)
}

func TestApplicationsHanlderTestSuite(t *testing.T) {
	suite.Run(t, new(ApplicationsHandlerTestSuite))
}
