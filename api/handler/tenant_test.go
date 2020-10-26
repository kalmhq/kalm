package handler

import (
	"net/http"
	"testing"

	"github.com/kalmhq/kalm/api/resources"
	"github.com/stretchr/testify/suite"
)

type TenantHandlerTestSuite struct {
	WithControllerTestSuite
}

func (suite *TenantHandlerTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()
}

func (suite *TenantHandlerTestSuite) TestGetEmptyTenantList() {
	suite.DoTestRequest(&TestRequestContext{
		Method: http.MethodGet,
		Path:   "/v1alpha1/tenants",
		Roles: []string{
			GetClusterOwnerRole(),
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var res []resources.Tenant
			rec.BodyAsJSON(&res)
			suite.Equal(200, rec.Code)
		},
	})
}

func TestTenantHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(TenantHandlerTestSuite))
}

func (suite *TenantHandlerTestSuite) TestTenantCreateThenList() {
	// Create two tenants
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterOwnerRole(),
		},
		Method: http.MethodPost,
		Path:   "/v1alpha1/tenants",
		Body:   `{"name": "test", "id": "test", "resourceQuotas": {"cpu": "4"}, "owners": ["test"]}`,
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(201, rec.Code)
		},
	})

	// Get list
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterOwnerRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/tenants",
		TestWithRoles: func(rec *ResponseRecorder) {
			var res []resources.Tenant
			rec.BodyAsJSON(&res)
			suite.Equal(200, rec.Code)
			suite.Len(res, 1)
		},
	})
}
