package handler

import (
	"fmt"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/stretchr/testify/suite"
	"net/http"
	"testing"
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

func (suite *ApplicationsHandlerTestSuite) TestCreateEmptyApplication() {
	name := "test"

	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetViewerRoleOfNs(name),
			GetClusterEditorRole(),
		},
		Method: http.MethodPost,
		Path:   "/v1alpha1/applications",
		Body:   fmt.Sprintf(`{"name": "%s"}`, name),
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsMissingRoleError(rec, "editor", "cluster")
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var res resources.ApplicationDetails
			rec.BodyAsJSON(&res)

			suite.NotNil(res.Application)
			suite.Equal("test", res.Application.Name)
		},
	})

	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetViewerRoleOfNs(name),
		},
		Namespace: name,
		Method:    http.MethodGet,
		Path:      "/v1alpha1/applications/" + name,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsMissingRoleError(rec, "viewer", name)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var res resources.ApplicationDetails
			rec.BodyAsJSON(&res)

			suite.NotNil(res.Application)
			suite.Equal("test", res.Application.Name)
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
			suite.IsMissingRoleError(rec, "editor", "cluster")
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(http.StatusNoContent, rec.Code)
		},
	})
}

func TestApplicationsHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(ApplicationsHandlerTestSuite))
}
