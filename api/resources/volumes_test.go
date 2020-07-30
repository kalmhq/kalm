package resources

import (
	"gotest.tools/assert"
	"k8s.io/apimachinery/pkg/api/resource"
	"testing"
)

func TestFormatQuantity(t *testing.T) {

	tests := []struct {
		Quantity  string
		FormatRst string
	}{
		{"0.1Gi", "107374183"},
		{"1Gi", "1073741824"},
		{"1G", "1000000000"},
		{"1M", "1000000"},
		{"0.1M", "100000"},
		{"1", "1"},
	}

	for _, test := range tests {
		quan := resource.MustParse(test.Quantity)
		str := formatQuantity(quan)

		assert.Equal(t, test.FormatRst, str)
	}
}
