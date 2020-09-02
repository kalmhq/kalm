package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	"k8s.io/apimachinery/pkg/util/rand"
	"net/http"
	"testing"
)

type AccessTokenTestSuite struct {
	WithControllerTestSuite
	namespace string
}

func TestAccessTokenTestSuite(t *testing.T) {
	suite.Run(t, new(AccessTokenTestSuite))
}

func (suite *AccessTokenTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()
	suite.namespace = "kalm-test"
	suite.ensureNamespaceExist(suite.namespace)
}

func (suite *AccessTokenTestSuite) TeardownSuite() {
	suite.ensureNamespaceDeleted(suite.namespace)
}

func (suite *AccessTokenTestSuite) TestGetEmptyList() {

	// list
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/access_tokens",
		TestWithRoles: func(rec *ResponseRecorder) {
			var res []resources.AccessToken
			rec.BodyAsJSON(&res)
			suite.Equal(200, rec.Code)
		},
	})
}

func (suite *AccessTokenTestSuite) TestCreateAndDelete() {
	token := rand.String(64)

	key := resources.AccessToken{
		Name: v1alpha1.GetAccessTokenNameFromToken(token),
		AccessTokenSpec: &v1alpha1.AccessTokenSpec{
			Subject: token,
			Token:   rand.String(64),
			Rules: []v1alpha1.AccessTokenRule{
				{
					Verb:      "view",
					Namespace: "*",
					Name:      "*",
					Kind:      "*",
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
		Path:   "/v1alpha1/access_tokens",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsMissingRoleError(rec, resources.InsufficientPermissionsError.Error())
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var res resources.AccessToken
			rec.BodyAsJSON(&res)
			suite.Equal(201, rec.Code)
			suite.Equal(key.Name, res.Name)
		},
	})

	// list
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/access_tokens",
		TestWithRoles: func(rec *ResponseRecorder) {
			var resList []resources.AccessToken
			rec.BodyAsJSON(&resList)
			suite.Equal(200, rec.Code)
			suite.Equal(1, len(resList))
		},
	})

	// Delete
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodDelete,
		Path:   "/v1alpha1/access_tokens",
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
		Path:   "/v1alpha1/access_tokens",
		TestWithRoles: func(rec *ResponseRecorder) {
			var resList []resources.AccessToken
			rec.BodyAsJSON(&resList)
			suite.Equal(200, rec.Code)
			suite.Equal(0, len(resList))
		},
	})
}
