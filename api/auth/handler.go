package auth

import (
	"strings"
)

func ExtractTokenFromHeader(header string) string {
	if header != "" && strings.HasPrefix(header, "Bearer ") {
		return strings.TrimPrefix(header, "Bearer ")
	}
	return ""
}
