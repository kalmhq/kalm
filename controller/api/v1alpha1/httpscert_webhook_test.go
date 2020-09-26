package v1alpha1

import (
	"github.com/stretchr/testify/assert"
	ctrl "sigs.k8s.io/controller-runtime"
	"testing"
)

func TestHttpsCertValidateSelfCACert(t *testing.T) {
	domainsList := [][]string{
		{"*"},
		{"*.example.com"},
		{"*.example.com", "x.y.com"},
	}

	cert := HttpsCert{
		ObjectMeta: ctrl.ObjectMeta{
			Name:      "kalm-cert",
			Namespace: "kalm-ns",
		},
		Spec: HttpsCertSpec{
			IsSelfManaged:             true,
			SelfManagedCertSecretName: "fake-sec-name",
		},
	}

	for _, domains := range domainsList {
		cert.Spec.Domains = domains
		assert.Nil(t, cert.validate())
	}
}

func TestHttpsCertValidateHTTP01Cert(t *testing.T) {
	okDomainsList := [][]string{
		{"example.com"},
		{"abc.example.com"},
		{"abc.example.com", "x.y.com"},
	}
	wrongDomainsList := [][]string{
		{"*.example.com"},
		{"abc.e*xample.com"},
		{},
	}

	cert := HttpsCert{
		ObjectMeta: ctrl.ObjectMeta{
			Name:      "kalm-cert",
			Namespace: "kalm-ns",
		},
		Spec: HttpsCertSpec{
			HttpsCertIssuer: DefaultHTTP01IssuerName,
		},
	}

	for _, domains := range okDomainsList {
		cert.Spec.Domains = domains
		assert.Nil(t, cert.validate())
	}

	for _, domains := range wrongDomainsList {
		cert.Spec.Domains = domains
		assert.NotNil(t, cert.validate())
	}
}

func TestHttpsCertValidateDNS01Cert(t *testing.T) {
	okDomainsList := [][]string{
		{"example.com"},
		{"abc.example.com"},
		{"x.y.com"},
		{"abc.example.com", "x.y.com"},
		{"*.example.com"},
		{"a.com", "*.abc.example.com"},
	}

	cert := HttpsCert{
		ObjectMeta: ctrl.ObjectMeta{
			Name:      "kalm-cert",
			Namespace: "kalm-ns",
		},
		Spec: HttpsCertSpec{
			HttpsCertIssuer: DefaultDNS01IssuerName,
		},
	}

	for _, domains := range okDomainsList {
		cert.Spec.Domains = domains
		assert.Nil(t, cert.validate())
	}
}

func TestHttpsCertIssuerNameMustExist(t *testing.T) {
	cert := HttpsCert{
		ObjectMeta: ctrl.ObjectMeta{
			Name:      "kalm-cert",
			Namespace: "kalm-ns",
		},
		Spec: HttpsCertSpec{
			HttpsCertIssuer: "issuer-name-not-exist",
		},
	}

	err := cert.validate()
	assert.NotNil(t, err)
}
