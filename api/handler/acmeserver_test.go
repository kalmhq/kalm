package handler

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
)

type ACMEServerHandlerTestSuite struct {
	WithControllerTestSuite
	namespace string
}

func TestACMEServerTestSuite(t *testing.T) {
	suite.Run(t, new(ACMEServerHandlerTestSuite))
}

func (suite *ACMEServerHandlerTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()
	suite.namespace = "kalm-test"
	suite.ensureNamespaceExist(suite.namespace)
}

func (suite *ACMEServerHandlerTestSuite) TestGetEmpty() {
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterViewerRole(),
		},
		Namespace: suite.namespace,
		Method:    http.MethodGet,
		Path:      "/v1alpha1/acmeserver",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec, "view", "cluster")
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(200, rec.Code)
			suite.Equal("null\n", rec.BodyAsString())
		},
	})
}

func (suite *ACMEServerHandlerTestSuite) TestCreateGetDelete() {
	acmeDomain := "acme.example.com"
	// nsDomain := "ns.example.com"
	expectedNSDomain := fmt.Sprintf("ns.%s", acmeDomain)

	// create
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Namespace: suite.namespace,
		Method:    http.MethodPost,
		Path:      "/v1alpha1/acmeserver",
		Body: resources.ACMEServer{
			ACMEDomain: acmeDomain,
		},
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec, "editor", "cluster")
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var res resources.ACMEServer
			rec.BodyAsJSON(&res)

			suite.Equal(200, rec.Code)
			suite.Equal(v1alpha1.ACMEServerName, res.Name)
		},
	})

	// GET
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterViewerRole(),
		},
		Namespace: suite.namespace,
		Method:    http.MethodGet,
		Path:      "/v1alpha1/acmeserver",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec, "viewer", "cluster")
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var acmeResp resources.ACMEServerResp
			rec.BodyAsJSON(&acmeResp)

			suite.Equal(v1alpha1.ACMEServerName, acmeResp.Name)
			suite.Equal(acmeDomain, acmeResp.ACMEDomain)
			suite.Equal(expectedNSDomain, acmeResp.NSDomain)
			suite.Equal("", acmeResp.IPForNameServer)
			suite.Equal(false, acmeResp.Ready)
		},
	})

	// DELETE
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Namespace: suite.namespace,
		Method:    http.MethodDelete,
		Path:      "/v1alpha1/acmeserver",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec, "editor", "cluster")
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(200, rec.Code)
		},
	})

	// GET after DELETE
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterViewerRole(),
		},
		Namespace: suite.namespace,
		Method:    http.MethodGet,
		Path:      "/v1alpha1/acmeserver",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec, "viewer", "cluster")
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(200, rec.Code)
			suite.Equal("null\n", rec.BodyAsString())
		},
	})
}
