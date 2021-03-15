package controllers

import (
	"context"
	"testing"
	"time"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
)

type HttpsCertControllerSuite struct {
	BasicSuite
}

func TestHttpsCertControllerSuite(t *testing.T) {
	suite.Run(t, new(HttpsCertControllerSuite))
}

func (suite *HttpsCertControllerSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite()
}

func (suite *HttpsCertControllerSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *HttpsCertControllerSuite) TestSelfManagedCertWithAbsentSecret() {
	httpsCert := genSelfManagedHttpsCert()
	suite.createHttpsCert(httpsCert)

	//get
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(
			context.Background(),
			types.NamespacedName{
				Name: httpsCert.Name,
			},
			&httpsCert,
		)

		return err == nil && len(httpsCert.Status.Conditions) >= 1 &&
			httpsCert.Status.Conditions[0].Type == v1alpha1.HttpsCertConditionReady &&
			httpsCert.Status.Conditions[0].Status == corev1.ConditionFalse
	})
}

func (suite *HttpsCertControllerSuite) TestSelfManagedCertWithSecret() {
	httpsCert := genSelfManagedHttpsCert()

	//prepare secret for httpsCert first
	suite.createObject(&corev1.Secret{
		ObjectMeta: v1.ObjectMeta{
			Namespace: istioNamespace,
			Name:      httpsCert.Spec.SelfManagedCertSecretName,
		},
	})

	suite.createHttpsCert(httpsCert)

	//get
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(
			context.Background(),
			types.NamespacedName{
				Name: httpsCert.Name,
			},
			&httpsCert,
		)

		return err == nil && len(httpsCert.Status.Conditions) >= 1 &&
			httpsCert.Status.Conditions[0].Type == v1alpha1.HttpsCertConditionReady &&
			httpsCert.Status.Conditions[0].Status == corev1.ConditionTrue
	})
}

func (suite *HttpsCertControllerSuite) TestBasicCRUD() {

	//create
	httpsCert := genHttpsCert(v1alpha1.DefaultCAIssuerName)
	suite.createHttpsCert(httpsCert)

	//get
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(
			context.Background(),
			types.NamespacedName{
				Name: httpsCert.Name,
			},
			&httpsCert,
		)

		return err == nil
	})

	// delete
	suite.reloadHttpsCert(&httpsCert)
	suite.Nil(suite.K8sClient.Delete(context.Background(), &httpsCert))

	// Read after deletion
	suite.Eventually(func() bool {
		return errors.IsNotFound(
			suite.K8sClient.Get(
				context.Background(),
				types.NamespacedName{
					Name: httpsCert.Name,
				},
				&httpsCert,
			),
		)
	})
}

func (suite *HttpsCertControllerSuite) reloadHttpsCert(httpsCert *v1alpha1.HttpsCert) {
	err := suite.K8sClient.Get(
		context.Background(),
		types.NamespacedName{
			Name: httpsCert.Name,
		},
		httpsCert,
	)

	suite.Nil(err)
}

func genSelfManagedHttpsCert(certNameOpt ...string) v1alpha1.HttpsCert {
	var certName string
	if len(certNameOpt) > 0 {
		certName = certNameOpt[0]
	} else {
		certName = randomName()[:12]
	}

	return v1alpha1.HttpsCert{
		ObjectMeta: v1.ObjectMeta{
			Name: certName,
		},
		Spec: v1alpha1.HttpsCertSpec{
			IsSelfManaged:             true,
			SelfManagedCertSecretName: "self-managed-sec-name1",
			Domains:                   []string{"a.demo.com", "b.demo.com"},
		},
	}
}
func genHttpsCert(issuer string, certNameOpt ...string) v1alpha1.HttpsCert {
	var certName string
	if len(certNameOpt) > 0 {
		certName = certNameOpt[0]
	} else {
		certName = randomName()[:12]
	}

	return v1alpha1.HttpsCert{
		ObjectMeta: v1.ObjectMeta{
			Name: certName,
		},
		Spec: v1alpha1.HttpsCertSpec{
			HttpsCertIssuer: issuer,
			Domains:         []string{"a.demo.com", "b.demo.com"},
		},
	}
}

//func (suite *HttpsCertControllerSuite) createHttpsCertIssuer(issuer v1alpha1.HttpsCertIssuer) {
//	suite.Nil(suite.K8sClient.Create(context.Background(), &issuer))
//
//	suite.Eventually(func() bool {
//		err := suite.K8sClient.Get(
//			context.Background(),
//			types.NamespacedName{
//				Name: issuer.Name,
//			},
//			&issuer,
//		)
//
//		return err == nil
//	})
//}
//
//func (suite *HttpsCertControllerSuite) createHttpsCert(cert v1alpha1.HttpsCert) {
//	suite.Nil(suite.K8sClient.Create(context.Background(), &cert))
//
//	suite.Eventually(func() bool {
//		err := suite.K8sClient.Get(
//			context.Background(),
//			types.NamespacedName{Name: cert.Name},
//			&cert,
//		)
//
//		return err == nil
//	})
//}

const tlsCert = `-----BEGIN CERTIFICATE-----
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

func TestParseCert(t *testing.T) {
	cert, interCert, err := ParseCert(tlsCert)
	fakeTime := cert.NotAfter.Add(-1 * time.Second)

	assert.Nil(t, err)
	assert.True(t, checkIfCertIssuedByTrustedCA(cert, interCert, fakeTime))
	//fmt.Println(cert.NotAfter)
	//fmt.Println(cert.Issuer)
	//fmt.Printf("%+v", cert)
}
