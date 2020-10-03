package handler

import (
	"github.com/stretchr/testify/suite"
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

func TestUsersHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(UsersHandlerTestSuite))
}
