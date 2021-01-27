package handler

import (
	"net/http"
	"testing"

	"github.com/kalmhq/kalm/api/resources"
	"github.com/stretchr/testify/suite"
)

type SsoHandlerTestSuite struct {
	WithControllerTestSuite
	namespace string
}

func (suite *SsoHandlerTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()
	suite.namespace = "kalm-system"
	suite.ensureNamespaceExist(suite.namespace)
}

func (suite *SsoHandlerTestSuite) TestSsoConfigHandler() {
	// create a sso
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodPost,
		Path:   "/v1alpha1/sso",
		Body:   `{"domain":"sso.test","connectors":[{"type":"gitlab","id":"gitlab","name":"Gitlab","config":{"baseURL":"https://sso.test","clientID":"clientid","clientSecret":"clientsecret","groups":["sso"]}}]}`,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.EqualValues(201, rec.Code)
		},
	})

	// list sso
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/sso",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var ssoConfig resources.SSOConfig
			rec.BodyAsJSON(&ssoConfig)
			suite.EqualValues(200, rec.Code)
			suite.EqualValues("Gitlab", ssoConfig.SingleSignOnConfigSpec.Connectors[0].Name)
		},
	})

	// update sso
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodPut,
		Path:   "/v1alpha1/sso",
		Body:   `{"domain":"sso.test","connectors":[{"type":"gitlab","id":"gitlab","name":"Gitlab2","config":{"baseURL":"https://sso.test","clientID":"clientid","clientSecret":"clientsecret","groups":["sso"]}}]}`,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.EqualValues(200, rec.Code)
		},
	})

	// list sso
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/sso",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var ssoConfigForUpdate resources.SSOConfig
			rec.BodyAsJSON(&ssoConfigForUpdate)
			suite.EqualValues(200, rec.Code)
			suite.EqualValues("Gitlab2", ssoConfigForUpdate.SingleSignOnConfigSpec.Connectors[0].Name)
		},
	})

	// delete sso
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodDelete,
		Path:   "/v1alpha1/sso",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.EqualValues(200, rec.Code)
		},
	})

	// list sso
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/sso",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var ssoConfigForDelete resources.SSOConfig
			rec.BodyAsJSON(&ssoConfigForDelete)
			suite.EqualValues(200, rec.Code)
			suite.Nil(ssoConfigForDelete.SingleSignOnConfigSpec)
		},
	})
}

func (suite *SsoHandlerTestSuite) TestProtectedEndpointsHandler() {
	protectedEndpoint := resources.ProtectedEndpoint{
		Name:         "test-protected-endpoint",
		Namespace:    suite.namespace,
		EndpointName: "test-protected-endpoint",
		Ports:        []uint32{80},
		Groups:       []string{"All"},
	}

	// create a protected endpoint
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetEditorRoleOfNamespace(suite.namespace),
		},
		Method:    http.MethodPost,
		Path:      "/v1alpha1/protectedendpoints",
		Body:      protectedEndpoint,
		Namespace: suite.namespace,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.EqualValues(201, rec.Code)
		},
	})

	// list sso protected endpoints
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/protectedendpoints",
		TestWithRoles: func(rec *ResponseRecorder) {
			var protectedEndpoints []*resources.ProtectedEndpoint
			rec.BodyAsJSON(&protectedEndpoints)
			suite.EqualValues(200, rec.Code)
			suite.EqualValues("component-test-protected-endpoint", protectedEndpoints[0].Name)
		},
	})

	// update protected endpoint
	protectedEndpoint.Ports = []uint32{3000}
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method:    http.MethodPut,
		Path:      "/v1alpha1/protectedendpoints",
		Body:      protectedEndpoint,
		Namespace: suite.namespace,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.EqualValues(200, rec.Code)
		},
	})

	// list sso protected endpoints
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/protectedendpoints",
		TestWithRoles: func(rec *ResponseRecorder) {
			var protectedEndpoints []*resources.ProtectedEndpoint
			rec.BodyAsJSON(&protectedEndpoints)
			suite.EqualValues(200, rec.Code)
			suite.EqualValues(3000, protectedEndpoints[0].Ports[0])
		},
	})

	// delete protected endpoint
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method:    http.MethodDelete,
		Path:      "/v1alpha1/protectedendpoints",
		Body:      protectedEndpoint,
		Namespace: suite.namespace,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.EqualValues(200, rec.Code)
		},
	})

	// list sso protected endpoints
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/protectedendpoints",
		TestWithRoles: func(rec *ResponseRecorder) {
			var protectedEndpoints []*resources.ProtectedEndpoint
			rec.BodyAsJSON(&protectedEndpoints)
			suite.EqualValues(200, rec.Code)
			suite.EqualValues(0, len(protectedEndpoints))
		},
	})
}

func TestSsoHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(SsoHandlerTestSuite))
}
