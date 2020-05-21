package handler

import (
	"encoding/json"
	"github.com/kapp-staging/kapp/api/resources"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	"github.com/stretchr/testify/assert"
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

func (suite *HttpsCertTestSuite) TestUploadHttpsCert() {

	caCert := `-----BEGIN CERTIFICATE-----
MIIFVjCCBD6gAwIBAgISBPNCxpUJsb9iD+AX7DviehGrMA0GCSqGSIb3DQEBCwUA
MEoxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MSMwIQYDVQQD
ExpMZXQncyBFbmNyeXB0IEF1dGhvcml0eSBYMzAeFw0yMDA1MjAwMzI5MzNaFw0y
MDA4MTgwMzI5MzNaMBoxGDAWBgNVBAMTD2hlbGxvLmthcHAubGl2ZTCCASIwDQYJ
KoZIhvcNAQEBBQADggEPADCCAQoCggEBAJ48RtSGIUl66BXE5H7TF81dm2JHWxS9
WaPLB9fw+7aE7Q80MqNemxC9919eiLsY43/5vE+oGyqCxy5OA+NjNhqkRyfRtLOy
C+qT30s+bSGVc7iwRqyBSA/1tVjvlio+bD3jmiKP8G4fX0MswJmUIhUqDjrgcz73
7WCn0SxfJrxRVihgQ0BYdwn7rhXd9owQK5KIYG80a/oLwnsplJCzI3MeDzhLz/oK
pcaPI8qoLH4Bxb7Od/tKODpp80ub6c4x+M+qI62Goo50+Sm6vwVzc8CsSlz2lGDN
608tBWDZ6HJrn0ogBa/qUFdSFXrQcpeVNVi+/suT/+wGJ1KtiDInM0ECAwEAAaOC
AmQwggJgMA4GA1UdDwEB/wQEAwIFoDAdBgNVHSUEFjAUBggrBgEFBQcDAQYIKwYB
BQUHAwIwDAYDVR0TAQH/BAIwADAdBgNVHQ4EFgQU88bxblZUQdX7RYMsUnKxUTwK
Z04wHwYDVR0jBBgwFoAUqEpqYwR93brm0Tm3pkVl7/Oo7KEwbwYIKwYBBQUHAQEE
YzBhMC4GCCsGAQUFBzABhiJodHRwOi8vb2NzcC5pbnQteDMubGV0c2VuY3J5cHQu
b3JnMC8GCCsGAQUFBzAChiNodHRwOi8vY2VydC5pbnQteDMubGV0c2VuY3J5cHQu
b3JnLzAaBgNVHREEEzARgg9oZWxsby5rYXBwLmxpdmUwTAYDVR0gBEUwQzAIBgZn
gQwBAgEwNwYLKwYBBAGC3xMBAQEwKDAmBggrBgEFBQcCARYaaHR0cDovL2Nwcy5s
ZXRzZW5jcnlwdC5vcmcwggEEBgorBgEEAdZ5AgQCBIH1BIHyAPAAdgDwlaRZ8gDR
gkAQLS+TiI6tS/4dR+OZ4dA0prCoqo6ycwAAAXIwWAAmAAAEAwBHMEUCIQD/weuk
7dWqw7iswofV7vt4ANxIvVFKfynHik1tDWGX2QIgUZwvdLxNjduE15kPB5G3zpbp
7I8Y2VIWIgxyZIGR3BEAdgCyHgXMi6LNiiBOh2b5K7mKJSBna9r6cOeySVMt74uQ
XgAAAXIwWAAVAAAEAwBHMEUCIGJwq3BvFcWn8CwRwXsMkOR2FUKAV1XcDwcJsbJa
jFsgAiEA5dqDJ0oL2V2ItThyNQRGTD7WvVKjghCL+EIO5yaYZaswDQYJKoZIhvcN
AQELBQADggEBAJJ8mKQ+IyuFlOMijD5RhU3U7l8rR5R/f9ITRUK5Q3NgkmhvNG8t
wBCcnVr3nNnKFYloLJ0rBSPyqs/nE9KljHzhZoootkP8PfXHe7A6FOR8xohzqHR0
u54xd1p+jTluVOE+Ofwa32VZ4VkIUIezyoSpLz1xk00tVtFlIrBn1Bk2vskTA5XK
znkm2KnVBuj75tteXjjMthi+yKW1Bfd1I2mCuSz8sylKyXx+2sX6YVR5o1+NamBi
7mK92Uhdb4Zq21RpDNYWrITAjVIunofNSgGjFu165ZGvPCMG0DwhvFnzWb97dsB5
fZLKGiQmUq6JTawO7JIZDdVDK7zZQTsEQG8=
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIEkjCCA3qgAwIBAgIQCgFBQgAAAVOFc2oLheynCDANBgkqhkiG9w0BAQsFADA/
MSQwIgYDVQQKExtEaWdpdGFsIFNpZ25hdHVyZSBUcnVzdCBDby4xFzAVBgNVBAMT
DkRTVCBSb290IENBIFgzMB4XDTE2MDMxNzE2NDA0NloXDTIxMDMxNzE2NDA0Nlow
SjELMAkGA1UEBhMCVVMxFjAUBgNVBAoTDUxldCdzIEVuY3J5cHQxIzAhBgNVBAMT
GkxldCdzIEVuY3J5cHQgQXV0aG9yaXR5IFgzMIIBIjANBgkqhkiG9w0BAQEFAAOC
AQ8AMIIBCgKCAQEAnNMM8FrlLke3cl03g7NoYzDq1zUmGSXhvb418XCSL7e4S0EF
q6meNQhY7LEqxGiHC6PjdeTm86dicbp5gWAf15Gan/PQeGdxyGkOlZHP/uaZ6WA8
SMx+yk13EiSdRxta67nsHjcAHJyse6cF6s5K671B5TaYucv9bTyWaN8jKkKQDIZ0
Z8h/pZq4UmEUEz9l6YKHy9v6Dlb2honzhT+Xhq+w3Brvaw2VFn3EK6BlspkENnWA
a6xK8xuQSXgvopZPKiAlKQTGdMDQMc2PMTiVFrqoM7hD8bEfwzB/onkxEz0tNvjj
/PIzark5McWvxI0NHWQWM6r6hCm21AvA2H3DkwIDAQABo4IBfTCCAXkwEgYDVR0T
AQH/BAgwBgEB/wIBADAOBgNVHQ8BAf8EBAMCAYYwfwYIKwYBBQUHAQEEczBxMDIG
CCsGAQUFBzABhiZodHRwOi8vaXNyZy50cnVzdGlkLm9jc3AuaWRlbnRydXN0LmNv
bTA7BggrBgEFBQcwAoYvaHR0cDovL2FwcHMuaWRlbnRydXN0LmNvbS9yb290cy9k
c3Ryb290Y2F4My5wN2MwHwYDVR0jBBgwFoAUxKexpHsscfrb4UuQdf/EFWCFiRAw
VAYDVR0gBE0wSzAIBgZngQwBAgEwPwYLKwYBBAGC3xMBAQEwMDAuBggrBgEFBQcC
ARYiaHR0cDovL2Nwcy5yb290LXgxLmxldHNlbmNyeXB0Lm9yZzA8BgNVHR8ENTAz
MDGgL6AthitodHRwOi8vY3JsLmlkZW50cnVzdC5jb20vRFNUUk9PVENBWDNDUkwu
Y3JsMB0GA1UdDgQWBBSoSmpjBH3duubRObemRWXv86jsoTANBgkqhkiG9w0BAQsF
AAOCAQEA3TPXEfNjWDjdGBX7CVW+dla5cEilaUcne8IkCJLxWh9KEik3JHRRHGJo
uM2VcGfl96S8TihRzZvoroed6ti6WqEBmtzw3Wodatg+VyOeph4EYpr/1wXKtx8/
wApIvJSwtmVi4MFU5aMqrSDE6ea73Mj2tcMyo5jMd6jmeWUHK8so/joWUoHOUgwu
X4Po1QYz+3dszkDqMp4fklxBwXRsW10KXzPMTZ+sOPAveyxindmjkW8lGy+QsRlG
PfZ+G6Z6h7mjem0Y+iWlkYcV4PIWL1iwBi8saCbGS5jN2p8M+X+Q7UNKEkROb3N6
KOqkqm57TH2H3eDJAkSnh6/DNFu0Qg==
-----END CERTIFICATE-----`

	bodyMap := map[string]interface{}{
		"name":                      "foobar-cert",
		"isSelfManaged":             true,
		"selfManagedCertContent":    caCert,
		"selfManagedCertPrivateKey": "",
	}

	bodyBytes, _ := json.Marshal(bodyMap)
	body := string(bodyBytes)

	rec := suite.NewRequest(http.MethodPost, "/v1alpha1/httpscerts/upload", body)

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
	suite.Equal(true, res.Items[0].Spec.IsSelfManaged)
	suite.Equal("", res.Items[0].Spec.HttpsCertIssuer)
	suite.Equal("hello.kapp.live", strings.Join(res.Items[0].Spec.Domains, ""))
	suite.Equal("kapp-self-managed-foobar-cert", res.Items[0].Spec.SelfManagedCertSecretName)
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

func TestJsonUnmarshal(t *testing.T) {

	res := resources.HttpsCert{}
	str := `{"isSelfManaged":true,"name":"foobar-cert","selfManagedCertContent":"\n-----BEGIN CERTIFICATE-----\nMIIE+jCCAuKgAwIBAgICB+QwDQYJKoZIhvcNAQELBQAwHjEcMBoGA1UEChMTS2Fw\ncCBDQSBmb3IgVGVzdCBDbzAeFw0yMDA1MTMwOTU0MjdaFw0yMDA1MTQwOTU0Mjda\nMB4xHDAaBgNVBAoTE0thcHAgQ0EgZm9yIFRlc3QgQ28wggIiMA0GCSqGSIb3DQEB\nAQUAA4ICDwAwggIKAoICAQDhKWRRuOTLSiB4L3noTZyt5tkfohwMg79VyNfVSWlz\nLscVh6STBVGysJ37l2NWlZrJwuyyDPrFKSbkfS76IX1OSkw+Nr4scvrc0TT3YuXO\nzCudyT/5mFbLXvtl3RO8qh7MdACWwQuTzjx9w64DOFbZbde/AmzpsYMqaN6XuN5q\nz3llAF0rJ2dJM16g+yQP+c4eO+9+yzSaOA9A5qir/BZy2/io4MtSCA1dO1UPr1bT\nYAmXy/kc8nmnoQQKDMuKNoH9V3iCnwbNd6tJ/hfhY50NOm77ki03VcoQMt3GJsmM\nhi62llUVsCBvYRcmREw/23umAKHW3j92DJSbJZ5vbU1lNTsEAwPUAz5ebhMTiV8u\nmlnfdQDaFXeoN9TceUNn6VigRVFJwSKFSZWwSJ2lZUPVMvVWuCyvo4FU3ajvyMhO\nlq3uxVSxll9A+40Y82wVWTfDmzBEmiKx29OMTtciGaBdDbCAGOKbKQYUSwwjmFJI\nvU/J0RUHugxSsApd326AfoZZa7voDUfEanx09zsHvwETnHlkp0ThCEnOA8NJz5CC\nu+6OB4f5ffZYZQgQQ5GvDwmg43ssIpKhrKfBbo1wP7z8LxJLbcq84RSiTpfuvSZ2\n288ilLbNhDe+S8z8QZwyD8zqtz0oqes0v9JWGwKBESkaHiE1rCYOlq7X19DWj2FO\ngQIDAQABo0IwQDAOBgNVHQ8BAf8EBAMCAoQwHQYDVR0lBBYwFAYIKwYBBQUHAwIG\nCCsGAQUFBwMBMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggIBAN5W\nCFe7005X31jJCACONP4aJAeyWA+zF653XKrmgq85tB2TrAJAmqFEAYEckIhUvksX\nc7c3GSXjh8/nSCnFtYmbtmUlK5ZEvSEtwcd/ADkEtaqdwdDmnQRGeZjUhhM5WaqV\nJYNBbxQD0Xlxr1QeH8GAKhmGAD/nz51efiJXb0Iw94Mx1Y0IbUkshRbmQZPV4C+b\nOqTbl6ySoqXQd/KX2MAtcS6CMCri7HV3eApXon2BBHLqNFe7/IszDND65iFuvuqv\n8fJX1i9O6KjqRoiFeHKA5ITSK+oRPEghYgMpcs2Se90JVebbXQb2RVdtuy3ggY1T\nu0Xrv3iQkqrN34a8Mqb7ntUKmTTTTOUtonexg5x1GbUKcPZzfl5yDk/EN3XbYdij\nrYMZD+XE2Bib3XTAGIa53tJ1bLOVO7N8kABkcXwqq4NBp8AaHqHkFPwbdMNsRP5h\nyxWCs8kBpIcgFWQgw+m75lbc/+9ygEb37fwYES2MWnmmrvWwk7X8CPuBYZs8S61h\n+qkm/Qb07WLnGtnJKW3nMFi3Q+sVEEE4zfClLiGZ3jInGVVNKbNFVkxBz/WuRNxa\nIaXRr3c4sXLz4FvcUU43SFkbpsqcPBVTWq+hIK5OKidcH+0b9UkVGIdC5K0j2cNZ\nnF/6snHZL3gZ/YJNQLMsbOaPcoLW9HkEUOOJLgSR\n-----END CERTIFICATE-----","selfManagedCertPrivateKey":""}`

	err := json.Unmarshal([]byte(str), &res)
	assert.Nil(t, err)
}
