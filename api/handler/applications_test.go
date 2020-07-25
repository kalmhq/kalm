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

func (suite *ApplicationsHandlerTestSuite) TestGetEmptyList() {
	rec := suite.NewRequest(http.MethodGet, "/v1alpha1/applications", nil)

	var res []resources.ApplicationDetails
	rec.BodyAsJSON(&res)

	suite.Equal(200, rec.Code)
}

func (suite *ApplicationsHandlerTestSuite) TestCreateEmptyApplication() {
	name := "test"
	body := fmt.Sprintf(`{"name": "%s"}`, name)

	var res resources.ApplicationDetails
	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/applications", body)
	rec.BodyAsJSON(&res)

	suite.NotNil(res.Application)
	suite.Equal("test", res.Application.Name)

	// get
	rec = suite.NewRequest(http.MethodGet, "/v1alpha1/applications/"+name, body)
	rec.BodyAsJSON(&res)

	suite.NotNil(res.Application)
	suite.Equal("test", res.Application.Name)
}

func (suite *ApplicationsHandlerTestSuite) TestDeleteApplication() {
	body := `{"name": "test3"}`
	// create first
	var res resources.ApplicationDetails
	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/applications", body)
	rec.BodyAsJSON(&res)

	suite.NotNil(res.Application)
	suite.Equal("test3", res.Application.Name)

	// delete
	rec = suite.NewRequest(http.MethodDelete, "/v1alpha1/applications/test3", body)
	suite.Equal(http.StatusNoContent, rec.Code)
}

func TestApplicationsHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(ApplicationsHandlerTestSuite))
}
