package handler

import (
	"github.com/stretchr/testify/suite"
	"net/http"
	"testing"
)

type UsersHandlerTestSuite struct {
	WithControllerTestSuite
	namespace string
}

func (suite *UsersHandlerTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()
	suite.namespace = "kalm-system"
	suite.ensureNamespaceExist(suite.namespace)
}

func (suite *UsersHandlerTestSuite) TestUsersHandler() {
	//// create
	//roleBindingsRequestBody := RoleBindingsRequestBody{
	//	Name: "test-users",
	//	Kind: "User",
	//	Namespace: suite.namespace,
	//	Roles:     []Role{RoleReader,RoleWriter},
	//}
	//req, err := json.Marshal(roleBindingsRequestBody)
	//suite.Nil(err)
	//rec := suite.NewRequest(http.MethodPost, "/v1alpha1/rolebindings", string(req))
	//suite.EqualValues(201, rec.Code)

	// list
	var roleBindingResponse RoleBindingResponse
	rec := suite.NewRequest(http.MethodGet, "/v1alpha1/storageclasses", "")
	rec.BodyAsJSON(&roleBindingResponse)

	suite.EqualValues(200, rec.Code)
	suite.EqualValues(0, len(roleBindingResponse.RoleBindings))
}

func TestUsersHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(UsersHandlerTestSuite))
}
