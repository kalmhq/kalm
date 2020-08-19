package handler

import (
	"encoding/json"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	"net/http"
	"testing"
)

type RegistriesHandlerTestSuite struct {
	WithControllerTestSuite
}

func (suite *RegistriesHandlerTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()
	suite.ensureNamespaceExist("kalm-system")
}

func (suite *RegistriesHandlerTestSuite) TestRegistriesHandler() {
	// create a registry
	registry := resources.DockerRegistry{
		DockerRegistrySpec: &v1alpha1.DockerRegistrySpec{
			Host: "docker.registry.host",
		},
		Name:     "test-registry",
		Username: "admin",
		Password: "password",
	}
	req, err := json.Marshal(registry)
	suite.Nil(err)

	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/registries", string(req))
	suite.NotNil(rec)
	suite.EqualValues(201, rec.Code)

	// get a registry
	var registryRes resources.DockerRegistry
	rec = suite.NewRequest(http.MethodGet, "/v1alpha1/registries/test-registry", "")
	rec.BodyAsJSON(&registryRes)
	suite.NotNil(rec)
	suite.EqualValues("test-registry", registryRes.Name)
	suite.EqualValues("admin", registryRes.Username)

	// list registries
	var registries []*resources.DockerRegistry
	rec = suite.NewRequest(http.MethodGet, "/v1alpha1/registries", "")
	rec.BodyAsJSON(&registries)
	suite.NotNil(rec)
	suite.EqualValues(1, len(registries))
	suite.EqualValues("test-registry", registries[0].Name)

	// update a registry
	registryForUpdate := resources.DockerRegistry{
		DockerRegistrySpec: &v1alpha1.DockerRegistrySpec{
			Host: "docker.registry.host",
		},
		Name:     "test-registry",
		Username: "admin2",
		Password: "password",
	}
	reqForUpdate, err := json.Marshal(registryForUpdate)
	suite.Nil(err)

	rec = suite.NewRequest(http.MethodPut, "/v1alpha1/registries/test-registry", string(reqForUpdate))
	suite.NotNil(rec)
	suite.EqualValues(200, rec.Code)

	var registryResForUpdate resources.DockerRegistry
	rec = suite.NewRequest(http.MethodGet, "/v1alpha1/registries/test-registry", "")
	rec.BodyAsJSON(&registryResForUpdate)
	suite.NotNil(rec)
	suite.EqualValues("admin2", registryResForUpdate.Username)

	// delete a registry
	rec = suite.NewRequest(http.MethodDelete, "/v1alpha1/registries/test-registry", "")
	suite.NotNil(rec)
	suite.EqualValues(200, rec.Code)

	rec = suite.NewRequest(http.MethodGet, "/v1alpha1/registries", "")
	rec.BodyAsJSON(&registries)
	suite.NotNil(rec)
	suite.EqualValues(0, len(registries))
}

func TestRegistriesHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(RegistriesHandlerTestSuite))
}
