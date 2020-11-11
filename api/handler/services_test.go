package handler

import (
	"net/http"
	"testing"

	"github.com/kalmhq/kalm/api/resources"
	"github.com/stretchr/testify/suite"
	v1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type ServicesHandlerTestSuite struct {
	WithControllerTestSuite
	namespace string
}

func (suite *ServicesHandlerTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()
	suite.namespace = "ns-test-services"
	suite.ensureNamespaceExist(suite.namespace)
}

func (suite *ServicesHandlerTestSuite) TestServicesHandler() {
	// create a service
	service := v1.Service{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      "test-services",
			Namespace: suite.namespace,
		},
		Spec: v1.ServiceSpec{
			Ports: []v1.ServicePort{
				{
					Port:     80,
					Protocol: v1.ProtocolTCP,
				},
			},
		},
	}

	err := suite.Create(&service)
	suite.Nil(err)

	// list all services in cluster level
	suite.DoTestRequest(&TestRequestContext{
		Debug: true,
		Roles: []string{
			GetClusterViewerRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/services",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var services []*resources.Service
			rec.BodyAsJSON(&services)
			suite.NotNil(rec)
			// TODO uncomment this, these asserts should pass
			// suite.EqualValues(2, len(services)) // default service named kubernetes
			// suite.EqualValues("test-services", services[1].Name)
		},
	})
}

func TestServicesHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(ServicesHandlerTestSuite))
}
