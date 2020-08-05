package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	"net/http"
	"testing"
)

type DeployKeyTestSuite struct {
	WithControllerTestSuite
	namespace string
}

func TestDeployKeyTestSuite(t *testing.T) {
	suite.Run(t, new(DeployKeyTestSuite))
}

func (suite *DeployKeyTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()
	suite.namespace = "kalm-test"
	suite.ensureNamespaceExist(suite.namespace)
}

func (suite *DeployKeyTestSuite) TeardownSuite() {
	suite.ensureNamespaceDeleted(suite.namespace)
}

func (suite *DeployKeyTestSuite) TestGetEmptyList() {
	rec := suite.NewRequest(http.MethodGet, "/v1alpha1/deploykeys", nil)

	var res []resources.DeployKey
	rec.BodyAsJSON(&res)

	suite.Equal(200, rec.Code)
}

func (suite *DeployKeyTestSuite) TestCreateAndDelete() {
	key := resources.DeployKey{
		Name: "deploy-key-" + randomName(),
		DeployKeySpec: &v1alpha1.DeployKeySpec{
			Scope:   v1alpha1.DeployKeyTypeCluster,
			Creator: "test",
		},
	}

	//CREATE
	rec := suite.NewRequest(
		http.MethodPost,
		"/v1alpha1/deploykeys",
		key,
	)

	var res resources.DeployKey
	rec.BodyAsJSON(&res)

	suite.Equal(201, rec.Code)
	suite.Equal(key.Name, res.Name)

	//LIST
	rec = suite.NewRequest(http.MethodGet, "/v1alpha1/deploykeys", nil)

	var resList []resources.DeployKey
	rec.BodyAsJSON(&resList)
	suite.Equal(200, rec.Code)
	suite.Equal(1, len(resList))

	//Delete
	rec = suite.NewRequest(http.MethodDelete,
		"/v1alpha1/deploykeys",
		key,
	)
	suite.Equal(200, rec.Code)

	//LIST again
	rec = suite.NewRequest(http.MethodGet, "/v1alpha1/deploykeys", nil)

	rec.BodyAsJSON(&resList)
	suite.Equal(200, rec.Code)
	suite.Equal(0, len(resList))
}
