package resources

import (
	"github.com/stretchr/testify/assert"
	"k8s.io/apimachinery/pkg/api/resource"
	"testing"
)

func TestTryFormatQuantity(t *testing.T) {
	str := "107374182400m"
	q1 := resource.MustParse(str)

	str2 := "0.1Gi"
	q2 := resource.MustParse(str2)

	assert.Equal(t, q1.String(), q2.String())

	q1Formatted := tryFormatQuantity(q1)
	q2Formatted := tryFormatQuantity(q2)
	assert.Equal(t, "102.4M", q1Formatted)
	assert.Equal(t, "102.4M", q2Formatted)
}