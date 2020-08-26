package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/controllers"
	"github.com/stretchr/testify/suite"
	"net/http"
	"testing"
)

type ACMEServerHandlerTestSuite struct {
	WithControllerTestSuite
}

func TestACMEServerTestSuite(t *testing.T) {
	suite.Run(t, new(ACMEServerHandlerTestSuite))
}

func (suite *ACMEServerHandlerTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()
}

func (suite *ACMEServerHandlerTestSuite) TestGetEmpty() {
	rec := suite.NewRequest(http.MethodGet, "/v1alpha1/acmeserver", nil)

	var res resources.ACMEServerResp
	rec.BodyAsJSON(&res)

	suite.Equal(200, rec.Code)
	suite.Equal("", res.Name)
}

func (suite *ACMEServerHandlerTestSuite) TestCreateGetDelete() {
	s := resources.ACMEServer{
		ACMEDomain: "acme.example.com",
		NSDomain:   "ns.example.com",
	}

	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/acmeserver", s)

	var res resources.ACMEServer
	rec.BodyAsJSON(&res)

	suite.Equal(201, rec.Code)
	suite.Equal(controllers.ACMEServerName, res.Name)

	// Get
	var acmeResp resources.ACMEServerResp
	rec = suite.NewRequest(http.MethodGet, "/v1alpha1/acmeserver", nil)
	rec.BodyAsJSON(&acmeResp)

	suite.Equal(controllers.ACMEServerName, acmeResp.Name)
	suite.Equal(s.ACMEDomain, acmeResp.ACMEDomain)
	suite.Equal(s.NSDomain, acmeResp.NSDomain)
	suite.Equal("", acmeResp.IPForNameServer)
	suite.Equal(false, acmeResp.Ready)

	// Delete
	rec = suite.NewRequest(http.MethodDelete, "/v1alpha1/acmeserver", nil)
	suite.Equal(200, rec.Code)

	rec = suite.NewRequest(http.MethodGet, "/v1alpha1/acmeserver", nil)
	rec.BodyAsJSON(&acmeResp)
	suite.Equal("", acmeResp.Name)
}
