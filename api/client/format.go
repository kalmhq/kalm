package client

import "fmt"

const SUB_PREFIX = "sub"

// All role policies in casbin models have a unified prefix "role_".
// In order to prevent any user’s email or group from having the same name as these policies,
// a different prefix will do the trick.
func ToSafeSubject(sub string) string {
	return fmt.Sprintf("%s-%s", SUB_PREFIX, sub)
}
