package v1alpha1

import (
	"github.com/stretchr/testify/assert"
	ctrl "sigs.k8s.io/controller-runtime"
	"testing"
)

func TestHttpsCertIssuer_Validate(t *testing.T) {
	issuer := HttpsCertIssuer{
		ObjectMeta: ctrl.ObjectMeta{
			Name: "test-name",
		},
		Spec: HttpsCertIssuerSpec{},
	}

	// at least 1 config
	assert.NotNil(t, issuer.validate())

	// at most 1 config
	issuer.Spec.CAForTest = &CAForTestIssuer{}
	issuer.Spec.ACMECloudFlare = &ACMECloudFlareIssuer{}
	assert.NotNil(t, issuer.validate())

	// 1 set
	issuer.Spec = HttpsCertIssuerSpec{}
	issuer.Spec.CAForTest = &CAForTestIssuer{}
	assert.Nil(t, issuer.validate())
}
