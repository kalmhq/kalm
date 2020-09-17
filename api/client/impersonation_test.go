package client

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestImpersonationParse(t *testing.T) {
	impersonation, impersonationType, err := parseImpersonationString("subject=user@email.com; type=user")

	assert.Nil(t, err)
	assert.Equal(t, "user@email.com", impersonation)
	assert.Equal(t, "user", impersonationType)

	_, _, err = parseImpersonationString("user@email.com")

	assert.NotNil(t, err)
}
