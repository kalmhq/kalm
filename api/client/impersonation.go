package client

import (
	"fmt"
	"regexp"
)

// Impersonation raw value should follow this format
//   "subject=user@email.com; type=user"
//   "subject=kalm; type=group"
func parseImpersonationString(raw string) (string, string, error) {
	re := regexp.MustCompile("subject=(.*); type=(.*)")

	matches := re.FindStringSubmatch(raw)

	// 0: the raw string
	// 1: the impersonation
	// 2: impersonation type
	if len(matches) != 3 {
		return "", "", fmt.Errorf("parse impersonation string failed. Didn't parse 2 values, string: %s", raw)
	}

	return matches[1], matches[2], nil
}
