package client

import (
	"fmt"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
)

// All role policies in casbin models have a unified prefix "role_".
// In order to prevent any user’s email or group from having the same name as these policies,
// a different prefix will do the trick.
func ToSafeSubject(sub string, subType string) string {
	switch subType {
	case v1alpha1.SubjectTypeUser:
		return fmt.Sprintf("user-%s", sub)
	case v1alpha1.SubjectTypeGroup:
		return fmt.Sprintf("group-%s", sub)
	default:
		panic(fmt.Sprintf("unknown subject type %s", subType))
	}
}
