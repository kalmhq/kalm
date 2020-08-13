package v1alpha1

import (
	"github.com/stretchr/testify/assert"
	ctrl "sigs.k8s.io/controller-runtime"
	"testing"
)

func TestComponentPluginBinding_Validate(t *testing.T) {
	binding := ComponentPluginBinding{
		ObjectMeta: ctrl.ObjectMeta{
			Namespace: "kalm-ns",
			Name:      "kalm-name",
		},
		Spec: ComponentPluginBindingSpec{
			ComponentName: "fake-component",
			PluginName:    "fake-plugin",
		},
	}

	assert.Nil(t, binding.validate())

	binding.Spec.ComponentName = "Invalid-Component-Name"
	assert.NotNil(t, binding.validate())
}
