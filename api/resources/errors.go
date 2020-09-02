package resources

import (
	"fmt"
	"k8s.io/apimachinery/pkg/api/errors"
)

func NoObjectViewerRoleError(scope, obj string) error {
	return errors.NewUnauthorized(fmt.Sprintf("Require viewer role of obj %s in application %s", obj, scope))
}

func NoObjectEditorRoleError(scope, obj string) error {
	return errors.NewUnauthorized(fmt.Sprintf("Require editor role obj %s in application %s", obj, scope))
}

func NoObjectManagerRoleError(scope, obj string) error {
	return errors.NewUnauthorized(fmt.Sprintf("Require owner role obj %s in application %s", obj, scope))
}

func NoNamespaceViewerRoleError(scope string) error {
	return errors.NewUnauthorized(fmt.Sprintf("Require viewer role in application %s", scope))
}

func NoNamespaceEditorRoleError(scope string) error {
	return errors.NewUnauthorized(fmt.Sprintf("Require editor role in application %s", scope))
}

func NoNamespaceManagerRoleError(scope string) error {
	return errors.NewUnauthorized(fmt.Sprintf("Require owner role in application %s", scope))
}

var NoClusterViewerRoleError = errors.NewUnauthorized("Require viewer role in cluster level")
var NoClusterEditorRoleError = errors.NewUnauthorized("Require editor role in cluster level")
var NoClusterOwnerRoleError = errors.NewUnauthorized("Require owner role in cluster level")
