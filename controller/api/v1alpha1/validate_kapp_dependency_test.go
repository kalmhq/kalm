package v1alpha1

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestIsValidateDependency(t *testing.T) {
	appSpec := ApplicationSpec{
		Components:          []ComponentSpec{
			{
				Name: "a",
				Dependencies: []string{"b"},
			},
			{
				Name: "b",
				Dependencies: []string{"a"},
			},
		},
	}

	errs := isValidateDependency(appSpec)
	assert.Equal(t, 2, len(errs))
}