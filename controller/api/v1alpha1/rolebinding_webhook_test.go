package v1alpha1

import (
	"github.com/stretchr/testify/assert"
	ctrl "sigs.k8s.io/controller-runtime"
	"testing"
)

func TestRoleBindingValidate(t *testing.T) {
	key := RoleBinding{
		ObjectMeta: ctrl.ObjectMeta{
			Name: "test",
		},
		Spec: RoleBindingSpec{
			Subject: "abc",
			Role:    RoleViewer,
			Creator: "test",
		},
	}

	assert.Nil(t, key.validate())
}
