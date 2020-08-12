package v1alpha1

import (
	"github.com/stretchr/testify/assert"
	ctrl "sigs.k8s.io/controller-runtime"
	"testing"
)

func TestHttpsCertValidate(t *testing.T) {
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
			HttpsCertIssuer: "default-cert-issuer",
		},
	}

	for _, domains := range domainsList {
		cert.Spec.Domains = domains

		assert.Nil(t, cert.validate())
	}
}
