package handler

import (
	"github.com/kapp-staging/kapp/api/resources"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	"net/http"
	"strings"
	"testing"
)

type HttpsCertTestSuite struct {
	WithControllerTestSuite
}

func TestHttpsCertTestSuite(t *testing.T) {
	suite.Run(t, new(HttpsCertTestSuite))
}

func (suite *HttpsCertTestSuite) TearDownTest() {
	suite.k8sClinet.RESTClient().Delete().AbsPath("/apis/core.kapp.dev/v1alpha1/httpscerts/foobar-cert").Do().Error()
}

func (suite *HttpsCertTestSuite) TestGetEmptyHttpsCertList() {
	rec := suite.NewRequest(http.MethodGet, "/v1alpha1/httpscerts", nil)

	var res []resources.HttpsCert
	rec.BodyAsJSON(&res)

	suite.Equal(200, rec.Code)
}

func (suite *HttpsCertTestSuite) TestCreateHttpsCert() {
	body := `{
  "name":    "foobar-cert",
  "httpsCertIssuer":  "foobar-issuer",
  "domains": ["example.com"]
}`

	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/httpscerts", body)

	var httpsCert resources.HttpsCert
	rec.BodyAsJSON(&httpsCert)

	suite.Equal(201, rec.Code)
	suite.Equal("foobar-cert", httpsCert.Name)

	var res v1alpha1.HttpsCertList
	err := suite.k8sClinet.RESTClient().Get().AbsPath("/apis/core.kapp.dev/v1alpha1/httpscerts").Do().Into(&res)
	suite.Nil(err)

	suite.Equal(1, len(res.Items))
	suite.Equal("foobar-cert", res.Items[0].Name)
	//fmt.Println("item:", res.Items[0])
	suite.Equal("foobar-issuer", res.Items[0].Spec.HttpsCertIssuer)
	suite.Equal("example.com", strings.Join(res.Items[0].Spec.Domains, ""))
}

func (suite *HttpsCertTestSuite) TestUpdateHttpsCert() {
	body := `{
  "name":    "foobar-cert",
  "httpsCertIssuer":  "foobar-issuer",
  "domains": ["example.com"]
}`

	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/httpscerts", body)

	var httpsCert resources.HttpsCert
	rec.BodyAsJSON(&httpsCert)

	suite.Equal(201, rec.Code)
	suite.Equal("foobar-cert", httpsCert.Name)

	var res v1alpha1.HttpsCertList
	err := suite.k8sClinet.RESTClient().Get().AbsPath("/apis/core.kapp.dev/v1alpha1/httpscerts").Do().Into(&res)
	suite.Nil(err)

	suite.Equal(1, len(res.Items))
	suite.Equal("foobar-cert", res.Items[0].Name)
	suite.Equal("foobar-issuer", res.Items[0].Spec.HttpsCertIssuer)
	suite.Equal("example.com", strings.Join(res.Items[0].Spec.Domains, ""))

	body = `{
  "name":    "foobar-cert",
  "httpsCertIssuer":  "foobar-issuer2",
  "domains": ["example.com2"]
}`
	rec = suite.NewRequest(http.MethodPut, "/v1alpha1/httpscerts/foobar-cert", body)

	rec.BodyAsJSON(&httpsCert)

	suite.Equal(200, rec.Code)
	suite.Equal("foobar-cert", httpsCert.Name)

	err = suite.k8sClinet.RESTClient().Get().AbsPath("/apis/core.kapp.dev/v1alpha1/httpscerts").Do().Into(&res)
	suite.Nil(err)

	suite.Equal(1, len(res.Items))
	suite.Equal("foobar-cert", res.Items[0].Name)
	suite.Equal("foobar-issuer2", res.Items[0].Spec.HttpsCertIssuer)
	suite.Equal("example.com2", strings.Join(res.Items[0].Spec.Domains, ""))
}

func (suite *HttpsCertTestSuite) TestDeleteHttpsCert() {
	body := `{
  "name":    "foobar-cert",
  "httpsCertIssuer":  "foobar-issuer",
  "domains": ["example.com"]
}`

	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/httpscerts", body)

	var httpsCert resources.HttpsCert
	rec.BodyAsJSON(&httpsCert)

	suite.Equal(201, rec.Code)
	suite.Equal("foobar-cert", httpsCert.Name)

	var res v1alpha1.HttpsCertList
	err := suite.k8sClinet.RESTClient().Get().AbsPath("/apis/core.kapp.dev/v1alpha1/httpscerts").Do().Into(&res)
	suite.Nil(err)

	suite.Equal(1, len(res.Items))
	suite.Equal("foobar-cert", res.Items[0].Name)
	//fmt.Println("item:", res.Items[0])
	suite.Equal("foobar-issuer", res.Items[0].Spec.HttpsCertIssuer)
	suite.Equal("example.com", strings.Join(res.Items[0].Spec.Domains, ""))


	rec = suite.NewRequest(http.MethodDelete, "/v1alpha1/httpscerts/foobar-cert", nil)
	rec.BodyAsJSON(&httpsCert)
	suite.Equal(200, rec.Code)

	err = suite.k8sClinet.RESTClient().Get().AbsPath("/apis/core.kapp.dev/v1alpha1/httpscerts").Do().Into(&res)
	suite.Nil(err)
	suite.Equal(0, len(res.Items))
}
