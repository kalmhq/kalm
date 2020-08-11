package v1alpha1

import (
	"github.com/stretchr/testify/assert"
	ctrl "sigs.k8s.io/controller-runtime"
	"testing"
)

func TestDockerRegistry_Validate(t *testing.T) {
	dockerRegistry := DockerRegistry{
		ObjectMeta: ctrl.ObjectMeta{
			Namespace: "test-ns",
			Name:      "test-name",
		},
		Spec: DockerRegistrySpec{},
	}

	dockerRegistry.Default()
	assert.Nil(t, dockerRegistry.validate())

	// invalid registry url
	dockerRegistry.Spec.Host = "/invalid/url"
	assert.NotNil(t, dockerRegistry.validate())
}
