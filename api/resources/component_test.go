package resources

import (
	"encoding/json"
	"github.com/stretchr/testify/assert"
	"k8s.io/apimachinery/pkg/api/resource"
	"testing"
)

func TestBuilder_MarshalOfComponentDetails(t *testing.T) {

	cpu := resource.MustParse("100m")
	memory := resource.MustParse("0.1Gi")

	marshalRst, err := json.Marshal(&ComponentDetails{
		CPURequest:    &CPUQuantity{cpu},
		MemoryRequest: &MemoryQuantity{memory},
	})

	assert.Nil(t, err)

	expected := `{"name":"","image":"","enableHeadlessService":false,"cpuRequest":"100","memoryRequest":"107374183","metrics":{"cpu":null,"memory":null},"istioMetricHistories":null,"services":null,"pods":null}`
	assert.Equal(t, expected, string(marshalRst))
}
