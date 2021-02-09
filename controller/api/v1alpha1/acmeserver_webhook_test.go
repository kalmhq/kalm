package v1alpha1

import (
	"testing"

	"github.com/stretchr/testify/assert"
	ctrl "sigs.k8s.io/controller-runtime"
)

func TestACMEServer_Validate(t *testing.T) {
	server := ACMEServer{
		ObjectMeta: ctrl.ObjectMeta{
			Name: "acme",
		},
		Spec: ACMEServerSpec{
			ACMEDomain: ".fake-plugin",
			NSDomain:   "*.fake-component",
		},
	}

	assert.NotNil(t, server.validate())

	server.Spec.ACMEDomain = "acme.example.com"
	server.Spec.NSDomain = "ns.example.com"
	assert.Nil(t, server.validate())
}
