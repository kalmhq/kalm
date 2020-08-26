package handler

import (
	"encoding/json"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/stretchr/testify/suite"
	"net/http"
	"testing"
)

type SsoHandlerTestSuite struct {
	WithControllerTestSuite
	namespace string
}

func (suite *SsoHandlerTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()
	suite.namespace = "kalm-system"
	suite.ensureNamespaceExist(suite.namespace)
}

func (suite *SsoHandlerTestSuite) TestSsoConfigHandler() {
	// create a sso
	req := `{"domain":"sso.test","connectors":[{"type":"gitlab","id":"gitlab","name":"Gitlab","config":{"baseURL":"https://sso.test","clientID":"clientid","clientSecret":"clientsecret","groups":["sso"]}}]}`
	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/sso", req)
	suite.EqualValues(201, rec.Code)

	// list sso
	var ssoConfig resources.SSOConfig
	rec = suite.NewRequest(http.MethodGet, "/v1alpha1/sso", "")
	rec.BodyAsJSON(&ssoConfig)
	suite.EqualValues(200, rec.Code)
	suite.EqualValues("Gitlab", ssoConfig.SingleSignOnConfigSpec.Connectors[0].Name)

	// update sso
	reqForUpdate := `{"domain":"sso.test","connectors":[{"type":"gitlab","id":"gitlab","name":"Gitlab2","config":{"baseURL":"https://sso.test","clientID":"clientid","clientSecret":"clientsecret","groups":["sso"]}}]}`
	rec = suite.NewRequest(http.MethodPut, "/v1alpha1/sso", reqForUpdate)
	suite.EqualValues(200, rec.Code)

	var ssoConfigForUpdate resources.SSOConfig
	rec = suite.NewRequest(http.MethodGet, "/v1alpha1/sso", "")
	rec.BodyAsJSON(&ssoConfigForUpdate)
	suite.EqualValues(200, rec.Code)
	suite.EqualValues("Gitlab2", ssoConfigForUpdate.SingleSignOnConfigSpec.Connectors[0].Name)

	// delete sso
	rec = suite.NewRequest(http.MethodDelete, "/v1alpha1/sso", "")
	suite.EqualValues(200, rec.Code)

	var ssoConfigForDelete resources.SSOConfig
	rec = suite.NewRequest(http.MethodGet, "/v1alpha1/sso", "")
	rec.BodyAsJSON(&ssoConfigForDelete)
	suite.EqualValues(200, rec.Code)
	suite.Nil(ssoConfigForDelete.SingleSignOnConfigSpec)
}

func (suite *SsoHandlerTestSuite) TestProtectedEndpointsHandler() {
	// create a protected endpoint
	protectedEndpoint := resources.ProtectedEndpoint{
		Name:         "test-protected-endpoint",
		Namespace:    suite.namespace,
		EndpointName: "test-protected-endpoint",
		Ports:        []uint32{80},
		Groups:       []string{"All"},
	}

	req, err := json.Marshal(protectedEndpoint)
	suite.Nil(err)
	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/protectedendpoints", string(req))
	suite.EqualValues(201, rec.Code)

	// list protected endpoint
	var protectedEndpoints []*resources.ProtectedEndpoint
	rec = suite.NewRequest(http.MethodGet, "/v1alpha1/protectedendpoints", "")
	rec.BodyAsJSON(&protectedEndpoints)
	suite.EqualValues(200, rec.Code)
	suite.EqualValues("component-test-protected-endpoint", protectedEndpoints[0].Name)

	// update protected endpoint
	protectedEndpoint.Ports = []uint32{3000}
	req, err = json.Marshal(protectedEndpoint)
	suite.Nil(err)
	rec = suite.NewRequest(http.MethodPut, "/v1alpha1/protectedendpoints", string(req))
	suite.EqualValues(201, rec.Code)

	rec = suite.NewRequest(http.MethodGet, "/v1alpha1/protectedendpoints", "")
	rec.BodyAsJSON(&protectedEndpoints)
	suite.EqualValues(200, rec.Code)
	suite.EqualValues(3000, protectedEndpoints[0].Ports[0])

	// delete protected endpoint
	rec = suite.NewRequest(http.MethodDelete, "/v1alpha1/protectedendpoints", string(req))
	suite.EqualValues(200, rec.Code)

	rec = suite.NewRequest(http.MethodGet, "/v1alpha1/protectedendpoints", "")
	rec.BodyAsJSON(&protectedEndpoints)
	suite.EqualValues(200, rec.Code)
	suite.EqualValues(0, len(protectedEndpoints))
}

func TestSsoHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(SsoHandlerTestSuite))
}
