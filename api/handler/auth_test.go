package handler

import (
	"github.com/stretchr/testify/suite"
	"net/http"
	"testing"
)

type (
	Res struct {
		Authorized bool `json:"authorized"`
	}

	AuthTestSuite struct {
		WithControllerTestSuite
	}
)

func (suite *AuthTestSuite) TestLoginWithUsernameAndPassword() {
	// TODO use real password and username
	rec := suite.NewRequestWithHeaders(http.MethodPost, "/login/token", H{
		"username": "foo",
		"password": "bar",
	}, nil)

	suite.Equal(http.StatusOK, rec.Code)
}

func (suite *AuthTestSuite) TestLoginStatusWithToken() {
	rec := suite.NewRequestWithHeaders(http.MethodGet, "/login/status", nil, nil)
	var res Res
	rec.BodyAsJSON(&res)
	suite.Equal(false, res.Authorized)
}

func (suite *AuthTestSuite) TestLoginStatusWithoutToken() {
	rec := suite.NewRequest(http.MethodGet, "/login/status", nil)
	var res Res
	rec.BodyAsJSON(&res)
	suite.Equal(true, res.Authorized)
}

func TestAuthTestSuite(t *testing.T) {
	suite.Run(t, new(AuthTestSuite))
}
