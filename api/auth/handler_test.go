package auth

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func Test_ExtractTokenFromHeader(t *testing.T) {
	header0 := ExtractTokenFromHeader("Bearer hToken")
	header1 := ExtractTokenFromHeader("hToken")

	assert.EqualValues(t, "hToken", header0)
	assert.EqualValues(t, "", header1)
}
