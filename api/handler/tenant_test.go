package handler

import (
	"net/http"
	"testing"

	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	"k8s.io/apimachinery/pkg/api/resource"
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

func (suite *TenantHandlerTestSuite) TestTenantCRUD() {
	var tenant *resources.Tenant
	// Create tenant
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

			tenant = &res[0]

			suite.Equal(13, len(tenant.ConsumedResources))

			cpuQuantity := tenant.ResourcesQuotas[v1alpha1.ResourceCPU]
			cpu, _ := (&cpuQuantity).AsInt64()

			suite.Equal(4, int(cpu))
		},
	})

	tenant.ResourcesQuotas[v1alpha1.ResourceCPU] = resource.MustParse("8")

	// Update tenant
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterOwnerRole(),
		},
		Method: http.MethodPut,
		Path:   "/v1alpha1/tenants/test",
		Body:   tenant,
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(200, rec.Code)
			var res resources.Tenant
			rec.BodyAsJSON(&res)

			cpuQuantity := res.ResourcesQuotas[v1alpha1.ResourceCPU]
			cpu, _ := (&cpuQuantity).AsInt64()

			suite.Equal(8, int(cpu))
			suite.False(res.Paused)
		},
	})

	// Pause
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterOwnerRole(),
		},
		Method: http.MethodPost,
		Path:   "/v1alpha1/tenants/test/pause",
		Body:   tenant,
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(200, rec.Code)
		},
	})

	// Get and check
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterOwnerRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/tenants/test",
		Body:   tenant,
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(200, rec.Code)
			var res resources.Tenant
			rec.BodyAsJSON(&res)
			suite.True(res.Paused)

			suite.Equal(13, len(res.ConsumedResources))
		},
	})

	// Resume
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterOwnerRole(),
		},
		Method: http.MethodPost,
		Path:   "/v1alpha1/tenants/test/resume",
		Body:   tenant,
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(200, rec.Code)
		},
	})

	// Get and check
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterOwnerRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/tenants/test",
		Body:   tenant,
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(200, rec.Code)
			var res resources.Tenant
			rec.BodyAsJSON(&res)
			suite.False(res.Paused)
		},
	})

	// Delete
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterOwnerRole(),
		},
		Method: http.MethodDelete,
		Path:   "/v1alpha1/tenants/test",
		Body:   tenant,
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(200, rec.Code)
		},
	})

	// Get and check
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterOwnerRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/tenants/test",
		Body:   tenant,
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(404, rec.Code)
		},
	})
}
