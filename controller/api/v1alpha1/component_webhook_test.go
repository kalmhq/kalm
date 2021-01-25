package v1alpha1

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"k8s.io/apimachinery/pkg/api/resource"
	ctrl "sigs.k8s.io/controller-runtime"
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

func TestComponentVolSTSMustSetPVC(t *testing.T) {
	sc := "standard"

	component := Component{
		ObjectMeta: ctrl.ObjectMeta{
			Namespace: "kalm-system",
			Name:      "kalm-comp-sts",
		},
		Spec: ComponentSpec{
			Image:        fmt.Sprintf("%s:%s", "foo", "bar"),
			Command:      "./kalm-api-server",
			WorkloadType: WorkloadTypeStatefulSet,
			Volumes: []Volume{
				{
					Path:             "/data",
					Size:             resource.MustParse("1Mi"),
					Type:             VolumeTypePersistentVolumeClaimTemplate,
					StorageClassName: &sc,
				},
			},
		},
	}

	errList := component.validate()
	assert.NotNil(t, errList)
	assert.Equal(t, 1, len(errList))
	assert.Equal(t, "must set pvc for this volume", errList[0].Err)
	assert.Equal(t, ".spec.volumes[0]", errList[0].Path)

	// default will set pvc
	component.Default()
	errList = component.validate()
	assert.Nil(t, errList)
}

func TestSTSVolOK2UpdateMountPathAndTmpVol(t *testing.T) {
	sc := "standard"

	componentOld := Component{
		ObjectMeta: ctrl.ObjectMeta{
			Namespace: "kalm-system",
			Name:      "kalm-comp-sts",
		},
		Spec: ComponentSpec{
			Image:        fmt.Sprintf("%s:%s", "foo", "bar"),
			Command:      "./kalm-api-server",
			WorkloadType: WorkloadTypeStatefulSet,
			Volumes: []Volume{
				{
					Path:             "/data",
					Size:             resource.MustParse("1Mi"),
					Type:             VolumeTypePersistentVolumeClaimTemplate,
					StorageClassName: &sc,
					PVC:              "pvc-x-0",
				},
			},
		},
	}
	componentOld.Default()

	componentNew := Component{
		ObjectMeta: ctrl.ObjectMeta{
			Namespace: "kalm-system",
			Name:      "kalm-comp-sts",
		},
		Spec: ComponentSpec{
			Image:        fmt.Sprintf("%s:%s", "foo", "bar"),
			Command:      "./kalm-api-server",
			WorkloadType: WorkloadTypeStatefulSet,
			Volumes: []Volume{
				{
					Path:             "/change-to-other-dir",
					Size:             resource.MustParse("1Mi"),
					Type:             VolumeTypePersistentVolumeClaimTemplate,
					StorageClassName: &sc,
					PVC:              "pvc-x-0",
				},
				{
					Path: "/data",
					Size: resource.MustParse("1Mi"),
					Type: VolumeTypeTemporaryMemory,
				},
			},
		},
	}
	componentNew.Default()

	err := componentNew.ValidateUpdate(&componentOld)
	assert.Nil(t, err)
}

func TestSTSForbiddenUpdatePersistVol(t *testing.T) {
	sc := "standard"

	componentOld := Component{
		ObjectMeta: ctrl.ObjectMeta{
			Namespace: "kalm-system",
			Name:      "kalm-comp-sts",
		},
		Spec: ComponentSpec{
			Image:        fmt.Sprintf("%s:%s", "foo", "bar"),
			Command:      "./kalm-api-server",
			WorkloadType: WorkloadTypeStatefulSet,
			Volumes: []Volume{
				{
					Path:             "/data",
					Size:             resource.MustParse("1Mi"),
					Type:             VolumeTypePersistentVolumeClaimTemplate,
					StorageClassName: &sc,
					PVC:              "pvc-x-0",
				},
			},
		},
	}
	componentOld.Default()

	componentNew := Component{
		ObjectMeta: ctrl.ObjectMeta{
			Namespace: "kalm-system",
			Name:      "kalm-comp-sts",
		},
		Spec: ComponentSpec{
			Image:        fmt.Sprintf("%s:%s", "foo", "bar"),
			Command:      "./kalm-api-server",
			WorkloadType: WorkloadTypeStatefulSet,
			Volumes: []Volume{
				{
					Path:             "/change-to-other-dir",
					Size:             resource.MustParse("1Mi"),
					Type:             VolumeTypePersistentVolumeClaimTemplate,
					StorageClassName: &sc,
					PVC:              "pvc-x-1",
				},
			},
		},
	}
	componentNew.Default()

	err := componentNew.ValidateUpdate(&componentOld)
	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "should not update volume of type: pvcTemplate")
}
