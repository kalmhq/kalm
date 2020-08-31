package client

import (
	"github.com/stretchr/testify/suite"
	"testing"
)

type TestSuite struct {
	suite.Suite
}

func (suite *TestSuite) TestTryParseJWTToken() {
	suite.Equal("unknown", tryToParseEntityFromToken(""))

	// Header:
	// {
	//   "alg": "HS256",
	//   "typ": "JWT"
	// }
	// Payload:
	// {
	//   "sub": "1234567890",
	//   "name": "John Doe",
	//   "iat": 1516239022
	// }
	jwtToken := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
	suite.Equal("1234567890", tryToParseEntityFromToken(jwtToken))
}

func TestTestSuite(t *testing.T) {
	suite.Run(t, new(TestSuite))
}
