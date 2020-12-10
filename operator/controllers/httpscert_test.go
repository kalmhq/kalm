package controllers

import (
	"testing"

	"gotest.tools/assert"
)

func TestKeepOnlyLetters(t *testing.T) {
	tests := []struct {
		From string
		To   string
	}{
		{"a.com", "a-com"},
		{"google.com", "google-com"},
		{"google@com", "google-com"},
	}

	for _, test := range tests {
		assert.Equal(t, test.To, keepOnlyLetters(test.From, "-"))
	}
}
