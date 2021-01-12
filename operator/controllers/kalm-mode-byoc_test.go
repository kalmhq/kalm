package controllers

import (
	"encoding/base64"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParseBase64EncodedString(t *testing.T) {
	data := []byte("VFBoVkVCYVlNWmhqS042c0xVbEoySm5Namhoc2FtZUM=")

	str, err := parseBase64EncodedString(data)
	assert.Nil(t, err)
	assert.Equal(t, "TPhVEBaYMZhjKN6sLUlJ2JnMjhhsameC", str)

	decoded, err := base64.StdEncoding.DecodeString(string(data))
	assert.Nil(t, err)
	assert.Equal(t, "TPhVEBaYMZhjKN6sLUlJ2JnMjhhsameC", string(decoded))

}
