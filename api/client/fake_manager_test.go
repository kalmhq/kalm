package client

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestFakeToken(t *testing.T) {

	token := ToFakeToken("foo@bar", "roleA", "roleB", "groupC")
	assert.Equal(t, "email=foo@bar groups=roleA,roleB,groupC", token)

	email, roles := parseFakeToken(token)

	assert.Equal(t, "foo@bar", email)
	assert.Equal(t, []string{"roleA", "roleB", "groupC"}, roles)
}

func TestFakeTokenWithNoRole(t *testing.T) {
	token := ToFakeToken("foo@bar", "")
	assert.Equal(t, "email=foo@bar groups=", token)

	email, roles := parseFakeToken(token)

	assert.Equal(t, "foo@bar", email)
	assert.Nil(t, roles)
}
