package handler

import (
	"github.com/kapp-staging/kapp/api/resources"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	"net/http"
	"testing"
)

type HttpsCertIssuerTestSuite struct {
	WithControllerTestSuite
}

func TestHttpsCertIssuerTestSuite(t *testing.T) {
	suite.Run(t, new(HttpsCertIssuerTestSuite))
}

func (suite *HttpsCertIssuerTestSuite) TearDownTest() {
	suite.k8sClinet.RESTClient().Delete().AbsPath("/apis/core.kapp.dev/v1alpha1/httpscertissuers/my-foobar-issuer").Do().Error()
}

func (suite *HttpsCertIssuerTestSuite) TestGetEmptyHCIssuerList() {
	rec := suite.NewRequest(http.MethodGet, "/v1alpha1/httpscertissuers", nil)

	var res []resources.HttpsCertIssuer
	rec.BodyAsJSON(&res)

	suite.Equal(200, rec.Code)
}

func (suite *HttpsCertIssuerTestSuite) TestCreateHttpsCertIssuer() {
	body := `{
  "name": "my-foobar-issuer",
  "caForTest": {}
}`

	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/httpscertissuers", body)

	var issuer resources.HttpsCertIssuer
	rec.BodyAsJSON(&issuer)

	suite.Equal(201, rec.Code)
	suite.Equal("my-foobar-issuer", issuer.Name)

	var res v1alpha1.HttpsCertIssuerList
	err := suite.k8sClinet.RESTClient().Get().AbsPath("/apis/core.kapp.dev/v1alpha1/httpscertissuers").Do().Into(&res)
	suite.Nil(err)

	suite.Equal(1, len(res.Items))
	suite.Equal("my-foobar-issuer", res.Items[0].Name)
	suite.NotNil(res.Items[0].Spec.CAForTest)
	suite.Nil(res.Items[0].Spec.ACMECloudFlare)
}

func (suite *HttpsCertIssuerTestSuite) TestUpdateHttpsCertIssuer() {
	body := `{
  "name": "my-foobar-issuer",
  "acmeCloudFlare": {
    "email": "foo@bar.com",
    "apiTokenSecretName": "foobar"
  }
}`

	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/httpscertissuers", body)

	var issuer resources.HttpsCertIssuer
	rec.BodyAsJSON(&issuer)

	suite.Equal(201, rec.Code)
	suite.Equal("my-foobar-issuer", issuer.Name)

	var res v1alpha1.HttpsCertIssuerList
	err := suite.k8sClinet.RESTClient().Get().AbsPath("/apis/core.kapp.dev/v1alpha1/httpscertissuers").Do().Into(&res)
	suite.Nil(err)

	suite.Equal(1, len(res.Items))
	suite.Equal("my-foobar-issuer", res.Items[0].Name)
	suite.Nil(res.Items[0].Spec.CAForTest)
	suite.NotNil(res.Items[0].Spec.ACMECloudFlare)
	suite.Equal("foo@bar.com", res.Items[0].Spec.ACMECloudFlare.Email)
	suite.Equal("foobar", res.Items[0].Spec.ACMECloudFlare.APITokenSecretName)

	// update
	body = `{
  "name": "my-foobar-issuer",
  "acmeCloudFlare": {
    "email": "foo@bar2.com",
    "apiTokenSecretName": "foobar2"
  }
}`
	rec = suite.NewRequest(http.MethodPut, "/v1alpha1/httpscertissuers/my-foobar-issuer", body)

	rec.BodyAsJSON(&issuer)

	suite.Equal(200, rec.Code)
	suite.Equal("my-foobar-issuer", issuer.Name)

	err = suite.k8sClinet.RESTClient().Get().AbsPath("/apis/core.kapp.dev/v1alpha1/httpscertissuers").Do().Into(&res)
	suite.Nil(err)

	suite.Equal(1, len(res.Items))
	suite.Equal("my-foobar-issuer", res.Items[0].Name)
	suite.Nil(res.Items[0].Spec.CAForTest)
	suite.NotNil(res.Items[0].Spec.ACMECloudFlare)
	suite.Equal("foo@bar2.com", res.Items[0].Spec.ACMECloudFlare.Email)
	suite.Equal("foobar2", res.Items[0].Spec.ACMECloudFlare.APITokenSecretName)
}

func (suite *HttpsCertIssuerTestSuite) TestDeleteHttpsCertIssuer() {
	body := `{
  "name": "my-foobar-issuer",
  "acmeCloudFlare": {
    "email": "foo@bar.com",
    "apiTokenSecretName": "foobar"
  }
}`

	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/httpscertissuers", body)

	var issuer resources.HttpsCertIssuer
	rec.BodyAsJSON(&issuer)

	suite.Equal(201, rec.Code)
	suite.Equal("my-foobar-issuer", issuer.Name)

	var res v1alpha1.HttpsCertIssuerList
	err := suite.k8sClinet.RESTClient().Get().AbsPath("/apis/core.kapp.dev/v1alpha1/httpscertissuers").Do().Into(&res)
	suite.Nil(err)

	suite.Equal(1, len(res.Items))
	suite.Equal("my-foobar-issuer", res.Items[0].Name)

	rec = suite.NewRequest(http.MethodDelete, "/v1alpha1/httpscertissuers/my-foobar-issuer", nil)
	rec.BodyAsJSON(&issuer)
	suite.Equal(200, rec.Code)

	err = suite.k8sClinet.RESTClient().Get().AbsPath("/apis/core.kapp.dev/v1alpha1/httpscertissuers").Do().Into(&res)
	suite.Nil(err)
	suite.Equal(0, len(res.Items))

}
