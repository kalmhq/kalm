package handler

import (
	"github.com/kapp-staging/kapp/api/resources"
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
	body := `{
    "name": "test"
}`

	var res resources.ApplicationDetails
	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/applications", body)
	rec.BodyAsJSON(&res)

	suite.NotNil(res.Application)
	suite.Equal("test", res.Application.Name)
}

func (suite *ApplicationsHandlerTestSuite) TestUpdateApplication() {
	body := `{
  "name": "test2",
  "isActive": false
}`
	// create first
	var res resources.ApplicationDetails
	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/applications", body)
	rec.BodyAsJSON(&res)

	suite.NotNil(res.Application)
	suite.Equal("test2", res.Application.Name)
	suite.False(res.Application.IsActive)

	// edit
	body = `{
  "name": "test2",
  "isActive": true
}`
	rec = suite.NewRequest(http.MethodPut, "/v1alpha1/applications/test2", body)
	rec.BodyAsJSON(&res)
	suite.NotNil(res.Application)
	suite.True(res.Application.IsActive)
}

func (suite *ApplicationsHandlerTestSuite) TestDeleteApplication() {
	body := `{
    "name": "test3"
}`
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
