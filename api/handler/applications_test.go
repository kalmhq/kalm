package handler

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/kalmhq/kalm/api/resources"
	"github.com/stretchr/testify/suite"
)

type ApplicationsHandlerTestSuite struct {
	WithControllerTestSuite
}

func (suite *ApplicationsHandlerTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()
}

func (suite *ApplicationsHandlerTestSuite) TestGetEmptyApplicationList() {
	suite.DoTestRequest(&TestRequestContext{
		Method: http.MethodGet,
		Path:   "/v1alpha1/applications",
		TestWithRoles: func(rec *ResponseRecorder) {
			var res []resources.ApplicationDetails
			rec.BodyAsJSON(&res)
			suite.Equal(200, rec.Code)
		},
	})
}

func (suite *ApplicationsHandlerTestSuite) TestApplicationListOnlyContainAuthorizedOnes() {
	// Create two applications
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodPost,
		Path:   "/v1alpha1/applications",
		Body:   fmt.Sprintf(`{"name": "%s"}`, "list-test-1"),
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(201, rec.Code)
		},
	})
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodPost,
		Path:   "/v1alpha1/applications",
		Body:   fmt.Sprintf(`{"name": "%s"}`, "list-test-2"),
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(201, rec.Code)
		},
	})

	// Get list
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetViewerRoleOfScope(defaultTenant, "list-test-2"),
		},
		Namespace: "list-test-2",
		Method:    http.MethodGet,
		Path:      "/v1alpha1/applications",
		TestWithRoles: func(rec *ResponseRecorder) {
			var res []resources.ApplicationDetails
			rec.BodyAsJSON(&res)
			suite.Equal(200, rec.Code)
			suite.Len(res, 1)
			suite.Equal("list-test-2", res[0].Name)
		},
	})

	// Get list from another tenant
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetViewerRoleOfScope(defaultTenant, "list-test-2"),
		},
		Tenant:    "anotherTenant",
		Namespace: "list-test-2",
		Method:    http.MethodGet,
		Path:      "/v1alpha1/applications",
		TestWithRoles: func(rec *ResponseRecorder) {
			var res []resources.ApplicationDetails
			rec.BodyAsJSON(&res)
			suite.Equal(200, rec.Code)
			suite.Len(res, 0)
		},
	})
}

func (suite *ApplicationsHandlerTestSuite) TestCreateEmptyApplication() {
	name := "test"

	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetViewerRoleOfScope(defaultTenant, name),
			GetClusterEditorRole(),
		},
		Method: http.MethodPost,
		Path:   "/v1alpha1/applications",
		Body:   fmt.Sprintf(`{"name": "%s"}`, name),
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec, "edit")
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var res resources.ApplicationDetails
			rec.BodyAsJSON(&res)

			suite.NotNil(res.Application)
			suite.Equal("test", res.Application.Name)
		},
	})

	// get
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetViewerRoleOfScope(defaultTenant, name),
		},
		Namespace: name,
		Method:    http.MethodGet,
		Path:      "/v1alpha1/applications/" + name,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec, "view", name)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var res resources.ApplicationDetails
			rec.BodyAsJSON(&res)

			suite.NotNil(res.Application)
			suite.Equal("test", res.Application.Name)
		},
	})

	// get from another tenant
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetViewerRoleOfScope(defaultTenant, name),
		},
		Namespace: name,
		Tenant:    "Tenant2",
		Method:    http.MethodGet,
		Path:      "/v1alpha1/applications/" + name,
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(404, rec.Code)
		},
	})
}

func (suite *ApplicationsHandlerTestSuite) TestDeleteApplication() {
	// create first
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodPost,
		Body:   `{"name": "test3"}`,
		Path:   "/v1alpha1/applications",
		TestWithRoles: func(rec *ResponseRecorder) {
			var res resources.ApplicationDetails
			rec.BodyAsJSON(&res)

			suite.NotNil(res.Application)
			suite.Equal("test3", res.Application.Name)
		},
	})

	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodDelete,
		Path:   "/v1alpha1/applications/test3",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec, "edit")
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(http.StatusNoContent, rec.Code)
		},
	})
}

func TestApplicationsHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(ApplicationsHandlerTestSuite))
}
