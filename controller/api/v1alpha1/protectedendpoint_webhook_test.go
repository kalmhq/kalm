package v1alpha1

import (
	"github.com/stretchr/testify/assert"
	ctrl "sigs.k8s.io/controller-runtime"
	"testing"
)

func TestProtectedEndpoint_Validate(t *testing.T) {
	protectedEndpoint := ProtectedEndpoint{
		ObjectMeta: ctrl.ObjectMeta{
			Namespace: "test-ns",
			Name:      "test-name",
		},
		Spec: ProtectedEndpointSpec{
			EndpointName: "test-ep",
			Type:         SSOConnectorTypeGithub,
			Ports:        []uint32{8080},
			Groups:       []string{},
		},
	}

	assert.Nil(t, protectedEndpoint.validate())

	// invalid ep name
	protectedEndpoint.Spec.EndpointName = "invalid-%-ep-name"
	assert.NotNil(t, protectedEndpoint.validate())

	// invalid port
	protectedEndpoint.Spec.EndpointName = "valid-ep-name"
	protectedEndpoint.Spec.Ports = []uint32{0}
	assert.NotNil(t, protectedEndpoint.validate())
}
