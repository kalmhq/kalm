package handler

//type ComponentTemplateTestSuite struct {
//	WithControllerTestSuite
//}
//
//func (suite *ComponentTemplateTestSuite) TestGetEmptyCTList() {
//	rec := suite.NewRequest(http.MethodGet, "/v1alpha1/componenttemplates", nil)
//
//	var res []resources.ApplicationDetails
//	rec.BodyAsJSON(&res)
//
//	suite.Equal(200, rec.Code)
//}
//
//func (suite *ComponentTemplateTestSuite) TestCreateCT() {
//	body := `{
//  "name": "web",
//  "image": "busybox",
//  "env": [{
//	"name": "componentEnv1",
//    "type": "static",
//	"value": "value1"
//  }, {
//	"name": "componentEnv2",
//	"value": "value2",
//	"type": "external"
//  }]
//}`
//
//	var res v1alpha1.ComponentTemplateSpec
//	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/componenttemplates", body)
//	rec.BodyAsJSON(&res)
//
//	suite.Equal(201, rec.Code)
//	suite.Equal("web", res.Name)
//	suite.Equal(2, len(res.Env))
//	suite.Equal(v1alpha1.EnvVarTypeStatic, res.Env[0].Type)
//	suite.Equal(v1alpha1.EnvVarTypeExternal, res.Env[1].Type)
//}
//
//func (suite *ComponentTemplateTestSuite) TestUpdateCT() {
//	body := `{
//  "name": "web2",
//  "image": "busybox",
//  "env": [{
//	"name": "componentEnv1",
//    "type": "static",
//	"value": "value1"
//  }, {
//	"name": "componentEnv2",
//	"value": "value2",
//	"type": "external"
//  }]
//}`
//
//	var res v1alpha1.ComponentTemplateSpec
//	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/componenttemplates", body)
//	rec.BodyAsJSON(&res)
//
//	suite.Equal(201, rec.Code)
//	suite.Equal("web2", res.Name)
//	suite.Equal(2, len(res.Env))
//	suite.Equal(v1alpha1.EnvVarTypeStatic, res.Env[0].Type)
//	suite.Equal(v1alpha1.EnvVarTypeExternal, res.Env[1].Type)
//
//	// edit
//	body = `{
//  "name": "web2",
//  "image": "busybox",
//  "env": [{
//	"name": "componentEnv1",
//    "type": "static",
//	"value": "value1-new"
//  }, {
//	"name": "componentEnv2",
//	"value": "value2",
//	"type": "external"
//  }]
//}`
//
//	rec = suite.NewRequest(http.MethodPut, "/v1alpha1/componenttemplates/web2", body)
//	rec.BodyAsJSON(&res)
//
//	suite.Equal(200, rec.Code)
//	suite.Equal("value1-new", res.Env[0].Value)
//}
//
//func (suite *ComponentTemplateTestSuite) TestDeleteCT() {
//	body := `{
//  "name": "web3",
//  "image": "busybox",
//  "env": [{
//	"name": "componentEnv1",
//    "type": "static",
//	"value": "value1"
//  }, {
//	"name": "componentEnv2",
//	"value": "value2",
//	"type": "external"
//  }]
//}`
//
//	var res v1alpha1.ComponentTemplateSpec
//	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/componenttemplates", body)
//	rec.BodyAsJSON(&res)
//
//	suite.Equal(201, rec.Code)
//	suite.Equal("web3", res.Name)
//
//	// delete
//	rec = suite.NewRequest(http.MethodDelete, "/v1alpha1/componenttemplates/web3", body)
//	suite.Equal(http.StatusNoContent, rec.Code)
//}
//
//func TestComponentTemplateHanlderTestSuite(t *testing.T) {
//	suite.Run(t, new(ComponentTemplateTestSuite))
//}
