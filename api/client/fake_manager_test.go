package client

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestFakeToken(t *testing.T) {

	token := ToFakeToken("foo@bar", "tenant", "roleA", "roleB", "groupC")
	assert.Equal(t, "email=foo@bar tenant=tenant groups=roleA,roleB,groupC", token)

	email, tenant, roles := parseFakeToken(token)

	assert.Equal(t, "foo@bar", email)
	assert.Equal(t, "tenant", tenant)
	assert.Equal(t, []string{"roleA", "roleB", "groupC"}, roles)
}

func TestFakeTokenWithNoRole(t *testing.T) {
	token := ToFakeToken("foo@bar", "woo")
	assert.Equal(t, "email=foo@bar tenant=woo groups=", token)

	email, tenant, roles := parseFakeToken(token)

	assert.Equal(t, "foo@bar", email)
	assert.Equal(t, "woo", tenant)
	assert.Nil(t, roles)
}
