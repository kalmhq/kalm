package handler

import (
	"net/http"
	"testing"

	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
)

type RegistriesHandlerTestSuite struct {
	WithControllerTestSuite
}

func (suite *RegistriesHandlerTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()
	suite.ensureNamespaceExist("kalm-system")
}

func (suite *RegistriesHandlerTestSuite) TestRegistriesHandler() {
	registry := resources.DockerRegistry{
		DockerRegistrySpec: &v1alpha1.DockerRegistrySpec{
			Host: "docker.registry.host",
		},
		Name:     "test-registry",
		Username: "admin",
		Password: "password",
	}

	// create a registry
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodPost,
		Path:   "/v1alpha1/registries",
		Body:   registry,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.NotNil(rec)
			suite.EqualValues(201, rec.Code)
		},
	})

	// get a registry
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterViewerRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/registries/test-registry",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var registryRes resources.DockerRegistry
			rec.BodyAsJSON(&registryRes)
			suite.NotNil(rec)
			suite.EqualValues("test-registry", registryRes.Name)
			suite.EqualValues("admin", registryRes.Username)
		},
	})

	// list registries
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterViewerRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/registries",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var registries []*resources.DockerRegistry
			rec.BodyAsJSON(&registries)
			suite.NotNil(rec)
			suite.EqualValues(1, len(registries))
			suite.EqualValues("test-registry", registries[0].Name)
		},
	})

	// update a registry
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodPut,
		Path:   "/v1alpha1/registries/test-registry",
		Body: resources.DockerRegistry{
			DockerRegistrySpec: &v1alpha1.DockerRegistrySpec{
				Host: "docker.registry.host",
			},
			Name:     "test-registry",
			Username: "admin2",
			Password: "password",
		},
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.NotNil(rec)
			suite.EqualValues(200, rec.Code)
		},
	})

	// get a registry
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterViewerRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/registries/test-registry",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var registryResForUpdate resources.DockerRegistry
			rec.BodyAsJSON(&registryResForUpdate)
			suite.NotNil(rec)
			suite.EqualValues("admin2", registryResForUpdate.Username)
		},
	})

	// delete a registry
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodDelete,
		Path:   "/v1alpha1/registries/test-registry",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.EqualValues(200, rec.Code)
		},
	})

	// list registries
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterViewerRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/registries",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var registries []*resources.DockerRegistry
			rec.BodyAsJSON(&registries)
			suite.NotNil(rec)
			suite.EqualValues(0, len(registries))
		},
	})

}

func TestRegistriesHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(RegistriesHandlerTestSuite))
}
