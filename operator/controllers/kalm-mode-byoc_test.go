package controllers

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParseBase64EncodedString(t *testing.T) {
	data := []byte("VFBoVkVCYVlNWmhqS042c0xVbEoySm5Namhoc2FtZUM=")

	str, err := parseBase64EncodedString(data)
	assert.Nil(t, err)
	assert.Equal(t, "TPhVEBaYMZhjKN6sLUlJ2JnMjhhsameC", str)
}
