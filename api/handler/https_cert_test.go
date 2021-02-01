package handler

import (
	"net/http"
	"strings"
	"testing"

	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/kalmhq/kalm/controller/controllers"
	"github.com/stretchr/testify/suite"
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type HttpsCertTestSuite struct {
	WithControllerTestSuite
}

func TestHttpsCertTestSuite(t *testing.T) {
	suite.Run(t, new(HttpsCertTestSuite))
}

func (suite *HttpsCertTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()

	suite.ensureNamespaceExist("istio-system")
	suite.ensureNamespaceExist(controllers.CertManagerNamespace)
}

func (suite *HttpsCertTestSuite) TearDownTest() {
	suite.ensureObjectDeleted(&v1alpha1.HttpsCert{ObjectMeta: metaV1.ObjectMeta{Name: "foobar-cert"}})
	suite.ensureObjectDeleted(&coreV1.Secret{ObjectMeta: metaV1.ObjectMeta{Name: "kalm-self-managed-foobar-cert", Namespace: "istio-system"}})
}

func (suite *HttpsCertTestSuite) TestGetEmptyHttpsCertList() {
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterViewerRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/httpscerts",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(200, rec.Code)

			var res []resources.HttpsCert
			rec.BodyAsJSON(&res)
		},
	})
}

func (suite *HttpsCertTestSuite) TestCreateHttpsCert() {
	var httpsCert resources.HttpsCert

	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterOwnerRole(),
		},
		Method: http.MethodPost,
		Path:   "/v1alpha1/httpscerts",
		Body: `{
  "httpsCertIssuer":  "foobar-issuer",
  "domains": ["example.com"]
}`,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(201, rec.Code)
			rec.BodyAsJSON(&httpsCert)

			//fmt.Println("item:", res.Items[0])
			suite.Equal("foobar-issuer", httpsCert.HttpsCertIssuer)
			suite.Equal("example.com", strings.Join(httpsCert.Domains, ""))
		},
	})

	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterViewerRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/httpscerts/" + httpsCert.Name,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(200, rec.Code)
			rec.BodyAsJSON(&httpsCert)

			suite.Equal("foobar-issuer", httpsCert.HttpsCertIssuer)
			suite.Equal("example.com", strings.Join(httpsCert.Domains, ""))
		},
	})

}

func (suite *HttpsCertTestSuite) TestCreateHttpsCertWithoutSetIssuer() {
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterOwnerRole(),
		},
		Method: http.MethodPost,
		Path:   "/v1alpha1/httpscerts",
		Body: `{
  "domains": ["example.com"]
}`,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(201, rec.Code)

			var httpsCert resources.HttpsCert
			rec.BodyAsJSON(&httpsCert)

			suite.Equal(v1alpha1.DefaultHTTP01IssuerName, httpsCert.HttpsCertIssuer)
			suite.Equal("example.com", strings.Join(httpsCert.Domains, ""))
		},
	})
}

const tlsCert = `-----BEGIN CERTIFICATE-----
MIIC1DCCAbwCCQCbDQZHa+cxEDANBgkqhkiG9w0BAQsFADArMSkwJwYDVQQDDCBo
ZWxsby13b3JsZC5rYWxtLWhlbGxvLXdvcmxkLnN2YzAgFw0yMDA4MTUxNjI4MDVa
GA8yMTIwMDcyMjE2MjgwNVowKzEpMCcGA1UEAwwgaGVsbG8td29ybGQua2FsbS1o
ZWxsby13b3JsZC5zdmMwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDF
RZz9sILZfMa2pYT21hyBb7FB+ldaXhXug1r637dSNXQgaeYE7ZJ2kbMpJyEZFLpb
lQC80zxmasWIkULPlgN3esSY5WSxD1Kn0QX4YAyaiibFnV9rHZALUhtexJ611n8n
zOm1SFfFK4Pb1dCRWZ0QMB8Z1olbUGViPKGXC5fPfpVEXKxwyAIIfMXUfIT1XHE6
PcQbl4N9Sr7LuBPRVao7252T/DNXA/xk7q3vrMQE2Rar9CMXqi9Io0rNXq+DbSWH
yr/h0u7G7s676JP1TBtDNFk5xFYEKopBLhCnpCmsnRpcboKZCUKr4hCMWmOZv/Y/
bVAtTB/y4FQeQipuUnZdAgMBAAEwDQYJKoZIhvcNAQELBQADggEBADfDQz4yYJAC
fBYDzxvennHMR7W0zV+WuoPs3FazuwJgW/Y1WiyOQFA0rXVh1LrcXfPrRYvmGMzs
55UUvhiACOHqWRfRBGdsAqDnkeLPEFW/6+RcfhEWonqg7qB8xbOL9XndFDoIS0v2
AQCd6NQcbTdwuhVuYaTdk3sqy65sjfhur0QpM1g7VEVdvCE73l6ElSGPNOSVktQz
wLaL/U7MHVfnFz7h4uRbLUCKhqhX8XPly0ciFdKMBNgLwmx7quvcmFs8883Z3rFJ
19r2aid5gMI9N4igzkvKXUtxXsfkHx3S0Alnt8KG5Ve/faAV1fEgzHT8r1J9hN4j
2SBi9zyW37U=
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

const tlsPK = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAxUWc/bCC2XzGtqWE9tYcgW+xQfpXWl4V7oNa+t+3UjV0IGnm
BO2SdpGzKSchGRS6W5UAvNM8ZmrFiJFCz5YDd3rEmOVksQ9Sp9EF+GAMmoomxZ1f
ax2QC1IbXsSetdZ/J8zptUhXxSuD29XQkVmdEDAfGdaJW1BlYjyhlwuXz36VRFys
cMgCCHzF1HyE9VxxOj3EG5eDfUq+y7gT0VWqO9udk/wzVwP8ZO6t76zEBNkWq/Qj
F6ovSKNKzV6vg20lh8q/4dLuxu7Ou+iT9UwbQzRZOcRWBCqKQS4Qp6QprJ0aXG6C
mQlCq+IQjFpjmb/2P21QLUwf8uBUHkIqblJ2XQIDAQABAoIBAAdukPSJwtQ4vC/D
WpgGBvrlX1MyADp6Uu8yaaoL5ZcmRmK2OqEy5hKreIlzXO7Z9g9fNLDocF0XZqu3
dUHmz+ifamqsMbft8No7qLLrw23LCJznSeH6MiQLCtbuJ2CIXS/9q0xWFmBqPER6
8KmZK66hcXqCt5gGFlu2FwxetnBtrl/bg4FK1HVNX4hi63bgxUHneqU5U9JF0bRX
FBH4HrVk2MVZ1ZdXRGal99vts7C6yzD7xB8uiTXUxPjWVh2gt4Svvow4UVafi1j0
UrhO0NtWLkjU22ms6g9gSjJebwwj3XsDqvJpWIy+SlymtKbELbax3btM2RFXCXBc
kzWV8e0CgYEA+l2ry/qie3N0a0CDfkpdPK2++WBeyFDLJ5lmRMjwvncsGBcKTyrP
AqtnbuOUFwCV+f2GJyR+TlrAshDZPle6qwhC3tUTAURfnD7wzCXgEKwgTRLIgL74
J9BkMaA1P3LCkh3qRs6n12/K0kn6j503aBXQoqGPjtnULCfd6fBYl5MCgYEAybYS
7QcQgN2hTq3Y5iGxUsFMcoaNVX/mI1z096wyqrQ+5tQU8W0g/axs9hAvhrY9hW1R
xVAb+VxqjIrS5nFkLj9SdOjI4/ofAyfgRxIj2+pwDlQSg9JiAPIm6+vkI+tfZJa8
2ZeLT9o6YbnQMSalvrNZpxmfSg28IjfrZh0DkE8CgYEA2cKjbFVhAZMYDTkdpbi0
g9RzKKADkKOFL7oi020ax+8LcSCJHPaU+zNuUWqsIZ2m1LsH9f+txCT3OWmiKrFP
cPdMglg9oXqA1nuAIXBIBPhRV/ggYKq5WJfOrcM0zSzZwxE19cRFBAL+HA2wWz1Z
NbTTtMBlBtC71HQQditQQvUCgYBsMdaK/zwR809/1W4/Wpkzy21HDPcoglceZtEb
PGlc+Ru4Us/9A80rZF55ygrEFmJ/fDjdPnAS3EhmpFwlsXLL/7kp7mc7KcGSvsPl
O0yyvFhoxx27SZC58yl/aGNSBQGBAf3ANTJLncGtA68xfgpvdOJE6FBxt1ZPgHEq
r6tmrwKBgF2T8cSj4UrwdHFQpAXd4t/QHWLMDEHUytPmEMz4PmRCSDnxob91kqoC
4S6ED+g3h85CT5tQPPG3MApj1mPgLtHOFgORIU4rueBNrMV6faqfuCNFBJ9cw7rr
6U4SX+2hFV3TmA9coUiFUcaH2ggKTpXSFJOx9iXhobBMSV5pYalP
-----END RSA PRIVATE KEY-----`

func (suite *HttpsCertTestSuite) TestUploadHttpsCert() {
	var httpsCert resources.HttpsCert

	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterOwnerRole(),
		},
		Method: http.MethodPost,
		Path:   "/v1alpha1/httpscerts/upload",
		Body: map[string]interface{}{
			"isSelfManaged":             true,
			"selfManagedCertContent":    tlsCert,
			"selfManagedCertPrivateKey": tlsPK,
		},
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(201, rec.Code)

			rec.BodyAsJSON(&httpsCert)

			suite.Equal(true, httpsCert.IsSelfManaged)
			suite.Equal("", httpsCert.HttpsCertIssuer)
			suite.Equal("hello-world.kalm-hello-world.svc", strings.Join(httpsCert.Domains, ""))

			// sec
			var sec coreV1.Secret
			err := suite.Get("istio-system", httpsCert.Name, &sec)
			suite.Nil(err)

			suite.Equal(sec.Data["tls.key"], []byte(tlsPK))
			suite.Equal(sec.Data["tls.crt"], []byte(tlsCert))
		},
	})

	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterViewerRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/httpscerts/" + httpsCert.Name,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(200, rec.Code)
			rec.BodyAsJSON(&httpsCert)
			suite.Equal("hello-world.kalm-hello-world.svc", strings.Join(httpsCert.Domains, ""))
		},
	})
}

func (suite *HttpsCertTestSuite) TestUpdateSelfManagedHttpsCert() {
	var httpsCert resources.HttpsCert

	// Upload
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterOwnerRole(),
		},
		Method: http.MethodPost,
		Path:   "/v1alpha1/httpscerts/upload",
		Body: map[string]interface{}{
			"isSelfManaged":             true,
			"selfManagedCertContent":    tlsCert,
			"selfManagedCertPrivateKey": tlsPK,
		},
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(201, rec.Code)
			rec.BodyAsJSON(&httpsCert)
		},
	})

	// update
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterOwnerRole(),
		},
		Method: http.MethodPut,
		Path:   "/v1alpha1/httpscerts/" + httpsCert.Name,
		Body: map[string]interface{}{
			"isSelfManaged":             true,
			"selfManagedCertContent":    tlsCert,
			"selfManagedCertPrivateKey": tlsPK,
		},
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(200, rec.Code)
		},
	})
}

func (suite *HttpsCertTestSuite) TestDeleteHttpsCert() {
	var httpsCert resources.HttpsCert

	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterOwnerRole(),
		},
		Method: http.MethodPost,
		Path:   "/v1alpha1/httpscerts",
		Body: `{
  "httpsCertIssuer":  "foobar-issuer",
  "domains": ["example.com"]
}`,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			rec.BodyAsJSON(&httpsCert)
			suite.Equal(201, rec.Code)
		},
	})

	// Delete
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterOwnerRole(),
		},
		Method: http.MethodDelete,
		Path:   "/v1alpha1/httpscerts/" + httpsCert.Name,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(200, rec.Code)
		},
	})

	// get
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterViewerRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/httpscerts/" + httpsCert.Name,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(404, rec.Code)
		},
	})
}
