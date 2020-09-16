package resources

import "github.com/kalmhq/kalm/controller/api/v1alpha1"

type RoleBinding struct {
	*v1alpha1.RoleBindingSpec
	Name      string `json:"name" validate:"required"`
	Namespace string `json:"namespace" validate:"required"`
}
