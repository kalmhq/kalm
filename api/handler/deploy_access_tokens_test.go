package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	"net/http"
	"testing"
)

type DeployAccessTokenTestSuite struct {
	WithControllerTestSuite
	namespace string
}

func TestDeployDeployAccessTokenTestSuite(t *testing.T) {
	suite.Run(t, new(DeployAccessTokenTestSuite))
}

func (suite *DeployAccessTokenTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()
	suite.namespace = "kalm-test"
	suite.ensureNamespaceExist(suite.namespace)
}

func (suite *DeployAccessTokenTestSuite) TeardownSuite() {
	suite.ensureNamespaceDeleted(suite.namespace)
}

func (suite *DeployAccessTokenTestSuite) TestGetEmptyDeployAccessTokenList() {
	// list
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/deploy_access_tokens",
		TestWithRoles: func(rec *ResponseRecorder) {
			var res []resources.AccessToken
			rec.BodyAsJSON(&res)
			suite.Equal(200, rec.Code)
		},
	})
}

func (suite *DeployAccessTokenTestSuite) TestTryToCreateInvalidDeployAccessToken() {
	key := resources.AccessToken{
		AccessTokenSpec: &v1alpha1.AccessTokenSpec{
			Rules: []v1alpha1.AccessTokenRule{
				{
					Verb:      "view",
					Namespace: "*",
					Name:      "*",
					Kind:      "components",
				},
			},
			Creator: "test",
		},
	}

	// create with wrong verb
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodPost,
		Body:   key,
		Path:   "/v1alpha1/deploy_access_tokens",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsMissingRoleError(rec, resources.InsufficientPermissionsError.Error())
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var res map[string]string
			rec.BodyAsJSON(&res)
			suite.Equal(400, rec.Code)
			//suite.Equal(res["message"], "Only edit verb is allowed")
		},
	})

	key.AccessTokenSpec.Rules[0].Verb = "edit"
	key.AccessTokenSpec.Rules[0].Kind = "pods"
	// create with wrong kind
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodPost,
		Body:   key,
		Path:   "/v1alpha1/deploy_access_tokens",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsMissingRoleError(rec, resources.InsufficientPermissionsError.Error())
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var res map[string]string
			rec.BodyAsJSON(&res)
			suite.Equal(400, rec.Code)
			//suite.Equal(res["message"], "Only 'components' Kind is allowed")
		},
	})
}

func (suite *DeployAccessTokenTestSuite) TestCreateAndDeleteDeployAccessToken() {
	key := resources.AccessToken{
		AccessTokenSpec: &v1alpha1.AccessTokenSpec{
			Rules: []v1alpha1.AccessTokenRule{
				{
					Verb:      "edit",
					Namespace: "*",
					Name:      "*",
					Kind:      "components",
				},
			},
			Creator: "test",
		},
	}

	// create
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodPost,
		Body:   key,
		Path:   "/v1alpha1/deploy_access_tokens",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsMissingRoleError(rec, resources.InsufficientPermissionsError.Error())
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var res resources.AccessToken
			rec.BodyAsJSON(&res)
			suite.Equal(201, rec.Code)
		},
	})

	// list
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/deploy_access_tokens",
		TestWithRoles: func(rec *ResponseRecorder) {
			var resList []resources.AccessToken
			rec.BodyAsJSON(&resList)
			suite.Equal(200, rec.Code)
			suite.Equal(1, len(resList))

			// set name for delete
			key.Name = resList[0].Name
		},
	})

	// Delete
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodDelete,
		Path:   "/v1alpha1/deploy_access_tokens",
		Body:   key,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsMissingRoleError(rec, resources.InsufficientPermissionsError.Error())
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(200, rec.Code)
		},
	})

	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/deploy_access_tokens",
		TestWithRoles: func(rec *ResponseRecorder) {
			var resList []resources.AccessToken
			rec.BodyAsJSON(&resList)
			suite.Equal(200, rec.Code)
			suite.Equal(0, len(resList))
		},
	})
}
