package v1alpha1

import (
	"fmt"
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
