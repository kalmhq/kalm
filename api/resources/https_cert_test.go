package resources

import (
	"gotest.tools/assert"
	"testing"
)

func TestCleanToResName(t *testing.T) {
	type pair struct {
		input    string
		expected string
	}

	pairList := []pair{
		{"*.kalm.dev", "wildcard-kalm-dev"},
		{"kalm.dev", "kalm-dev"},
		{"*.KALM.dev", "wildcard-kalm-dev"},
		{"KALM.dev", "kalm-dev"},
	}

	for _, one := range pairList {
		assert.Equal(t, one.expected, cleanToResName(one.input), "fail for:"+one.input)
	}
}
