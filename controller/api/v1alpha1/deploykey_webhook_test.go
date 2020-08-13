package v1alpha1

import (
	"github.com/stretchr/testify/assert"
	ctrl "sigs.k8s.io/controller-runtime"
	"testing"
)

func TestDeployKey_webhook(t *testing.T) {
	key := DeployKey{
		ObjectMeta: ctrl.ObjectMeta{
			Namespace: "kalm-ns",
			Name:      "fake-name",
		},
		Spec: DeployKeySpec{
			Scope:     DeployKeyTypeNamespace,
			Resources: []string{"fake-ns"},
		},
	}

	key.Default()
	assert.Nil(t, key.validate())

	// invalid resource
	key.Spec.Scope = DeployKeyTypeComponent
	assert.NotNil(t, key.validate())
	// right resource
	key.Spec.Resources = []string{"ns/comp"}
	assert.Nil(t, key.validate())
}
