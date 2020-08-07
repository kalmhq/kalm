package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/kalmhq/kalm/controller/controllers"
	"github.com/stretchr/testify/suite"
	coreV1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
	"testing"
)

type HttpsCertIssuerTestSuite struct {
	WithControllerTestSuite
}

func TestHttpsCertIssuerTestSuite(t *testing.T) {
	suite.Run(t, new(HttpsCertIssuerTestSuite))
}

func (suite *HttpsCertIssuerTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()

	suite.ensureNamespaceExist(controllers.CertManagerNamespace)
}

func (suite *HttpsCertIssuerTestSuite) TearDownTest() {
	suite.ensureObjectDeleted(&v1alpha1.HttpsCertIssuer{ObjectMeta: metav1.ObjectMeta{Name: "my-foobar-issuer"}})
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
	err := suite.List(&res)
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
    "secret": "foobar"
  }
}`

	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/httpscertissuers", body)

	var issuer resources.HttpsCertIssuer
	rec.BodyAsJSON(&issuer)

	suite.Equal(201, rec.Code)
	suite.Equal("my-foobar-issuer", issuer.Name)

	var res v1alpha1.HttpsCertIssuerList
	err := suite.List(&res)
	suite.Nil(err)

	secName := resources.GenerateSecretNameForACME(issuer)
	secNs := controllers.CertManagerNamespace

	suite.Equal(1, len(res.Items))
	suite.Equal("my-foobar-issuer", res.Items[0].Name)
	suite.Nil(res.Items[0].Spec.CAForTest)
	suite.NotNil(res.Items[0].Spec.ACMECloudFlare)
	suite.Equal("foo@bar.com", res.Items[0].Spec.ACMECloudFlare.Email)
	suite.Equal(secName, res.Items[0].Spec.ACMECloudFlare.APITokenSecretName)

	// check content of secret
	var sec coreV1.Secret
	err = suite.Get(secNs, secName, &sec)
	suite.Nil(err)
	suite.Equal("foobar", string(sec.Data["content"]))

	// update
	body = `{
  "name": "my-foobar-issuer",
  "acmeCloudFlare": {
    "account": "foo@bar2.com",
    "secret": "foobar2"
  }
}`
	rec = suite.NewRequest(http.MethodPut, "/v1alpha1/httpscertissuers/my-foobar-issuer", body)

	rec.BodyAsJSON(&issuer)

	suite.Equal(200, rec.Code)
	suite.Equal("my-foobar-issuer", issuer.Name)

	err = suite.List(&res)
	suite.Nil(err)

	suite.Equal(1, len(res.Items))
	suite.Equal("my-foobar-issuer", res.Items[0].Name)
	suite.Nil(res.Items[0].Spec.CAForTest)
	suite.NotNil(res.Items[0].Spec.ACMECloudFlare)
	suite.Equal("foo@bar2.com", res.Items[0].Spec.ACMECloudFlare.Email)
	suite.Equal(resources.GenerateSecretNameForACME(issuer), res.Items[0].Spec.ACMECloudFlare.APITokenSecretName)

	err = suite.Get(secNs, secName, &sec)
	suite.Nil(err)
	suite.Equal("foobar2", string(sec.Data["content"]))
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
	err := suite.List(&res)
	suite.Nil(err)

	suite.Equal(1, len(res.Items))
	suite.Equal("my-foobar-issuer", res.Items[0].Name)

	rec = suite.NewRequest(http.MethodDelete, "/v1alpha1/httpscertissuers/my-foobar-issuer", nil)
	suite.Equal(200, rec.Code)

	err = suite.List(&res)
	suite.Nil(err)
	suite.Equal(0, len(res.Items))
}
