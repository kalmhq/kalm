package handler

import (
	"github.com/kapp-staging/kapp/api/resources"
	"github.com/stretchr/testify/suite"
	"net/http"
	"testing"
)

type ApplicationsHandlerTestSuite struct {
	WithControllerTestSuite
}

func (suite *ApplicationsHandlerTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()
	//	plugin := &v1alpha1.ApplicationPlugin{
	//		TypeMeta: metaV1.TypeMeta{
	//			Kind:       "ApplicationPlugin",
	//			APIVersion: "core.kapp.dev/v1alpha1",
	//		},
	//		ObjectMeta: metaV1.ObjectMeta{
	//			Name: "test",
	//		},
	//		Spec: v1alpha1.ApplicationPluginSpec{
	//			Src: `
	//function BeforeApplicationSave(app) {
	//    return app;
	//}`,
	//		},
	//	}
	//	bts, _ := json.Marshal(plugin)
	//	suite.k8sClinet.RESTClient().Post().Body(bts).AbsPath("/apis/core.kapp.dev/v1alpha1/applicationplugins").DoRaw()
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

	// delete
	rec = suite.NewRequest(http.MethodDelete, "/v1alpha1/applications/test3", body)
	suite.Equal(http.StatusNoContent, rec.Code)
}

func (suite *ApplicationsHandlerTestSuite) TestUpdateApplicationPlugins() {
	body := `{
    "name": "test-update-plugins",
    "namespace": "test-update-plugins",
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

	// add one plugin
	body = `{
    "name": "test-update-plugins",
    "namespace": "test-update-plugins",
    "sharedEnvs": [{
      "name": "env1",
      "value": "value1-new"
    }],
	"plugins": [{
		"name": "test",
        "config": {}
	}]
}`

	rec = suite.NewRequest(http.MethodPut, "/v1alpha1/applications/test-update-plugins", body)
	rec.BodyAsJSON(&res)
	suite.NotNil(res.Application)

	// add second plugin
	body = `{
    "name": "test-update-plugins",
    "namespace": "test-update-plugins",
    "sharedEnvs": [{
      "name": "env1",
      "value": "value1-new"
    }],
	"plugins": [{
		"name": "test",
        "config": {}
	},{
		"name": "test2",
        "config": {
			"a": 1
		}
	}]
}`

	rec = suite.NewRequest(http.MethodPut, "/v1alpha1/applications/test-update-plugins", body)
	rec.BodyAsJSON(&res)
	suite.NotNil(res.Application)

	// update second plugin
	body = `{
    "name": "test-update-plugins",
    "namespace": "test-update-plugins",
    "sharedEnvs": [{
      "name": "env1",
      "value": "value1-new"
    }],
	"plugins": [{
		"name": "test",
        "config": {}
	},{
		"name": "test2",
        "config": {
			"b": 1
		}
	}]
}`

	rec = suite.NewRequest(http.MethodPut, "/v1alpha1/applications/test-update-plugins", body)
	rec.BodyAsJSON(&res)
	suite.NotNil(res.Application)

	// delete plugin
	body = `{
    "name": "test-update-plugins",
    "namespace": "test-update-plugins",
    "sharedEnvs": [{
      "name": "env1",
      "value": "value1-new"
    }],
	"plugins": [{
		"name": "test2",
        "config": {
			"b": 1
		}
	}]
}`

	rec = suite.NewRequest(http.MethodPut, "/v1alpha1/applications/test-update-plugins", body)
	rec.BodyAsJSON(&res)
	suite.NotNil(res.Application)
}

func TestApplicationsHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(ApplicationsHandlerTestSuite))
}
