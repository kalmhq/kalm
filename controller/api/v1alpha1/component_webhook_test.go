package v1alpha1

import (
	"fmt"
	"github.com/stretchr/testify/assert"
	"k8s.io/apimachinery/pkg/api/resource"
	ctrl "sigs.k8s.io/controller-runtime"
	"testing"
)

func TestComponentValidate(t *testing.T) {
	component := Component{
		ObjectMeta: ctrl.ObjectMeta{
			Namespace: "kalm-system",
			Name:      "kalm",
		},
		Spec: ComponentSpec{
			Image:   fmt.Sprintf("%s:%s", "foo", "bar"),
			Command: "./kalm-api-server",
			Ports: []Port{
				{
					Protocol:      PortProtocolHTTP,
					ContainerPort: 3001,
					ServicePort:   80,
				},
			},
		},
	}

	component.Default()

	if component.validate() != nil {
		t.Fatalf("component should be valid")
	}
}
func TestComponentValidate2(t *testing.T) {
	sc := "standard"

	component := Component{
		ObjectMeta: ctrl.ObjectMeta{
			Namespace: "kalm-system",
			Name:      "kalm-comp-2",
		},
		Spec: ComponentSpec{
			Image:        fmt.Sprintf("%s:%s", "foo", "bar"),
			Command:      "./kalm-api-server",
			WorkloadType: WorkloadTypeStatefulSet,
			Ports: []Port{
				{
					Protocol:      PortProtocolHTTP,
					ContainerPort: 3001,
					ServicePort:   80,
				},
			},
			Volumes: []Volume{
				{
					Path:             "/data",
					Size:             resource.MustParse("1Mi"),
					Type:             VolumeTypePersistentVolumeClaimTemplate,
					StorageClassName: &sc,
					PVC:              "myvol",
				},
				{
					Path: "/data",
					Size: resource.MustParse("1Mi"),
					Type: VolumeTypeTemporaryMemory,
				},
			},
		},
	}

	component.Default()

	assert.Nil(t, component.validate())
}
