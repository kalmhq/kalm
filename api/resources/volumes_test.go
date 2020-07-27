package resources

import (
	"fmt"
	"gotest.tools/assert"
	"k8s.io/apimachinery/pkg/api/resource"
	"testing"
)

func TestTryFormatQuantity(t *testing.T) {
	str := "107374182400m"
	q1 := resource.MustParse(str)

	str2 := "0.1Gi"
	q2 := resource.MustParse(str2)

	assert.Equal(t, q1.String(), q2.String())

	fmt.Println(q1.String())
	fmt.Println(q1.Format)
	fmt.Println(q1.MilliValue())
	fmt.Println(q1.Value())

	fmt.Println(q2.String())
	fmt.Println(q2.Format)
	fmt.Println(q2.MilliValue())
	fmt.Println(q2.Value())
}
