package v1alpha1

import (
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
)

// EnvVar represents an environment variable present in a Container.
type EnvVar struct {
	// Name of the environment variable. Must be a C_IDENTIFIER.
	Name string `json:"name"`

	Value string `json:"value,omitempty"`

	SharedEnv string `json:"sharedEnv,omitempty"`

	ComponentPort string `json:"componentPort,omitempty"`

	Prefix string `json:"prefix,omitempty"`

	Suffix string `json:"suffix,omitempty"`
}

type Port struct {
	Name string `json:"name"`

	// +kubebuilder:validation:Maximum:65535
	ContainerPort uint32 `json:"containerPort"`

	// +kubebuilder:validation:Maximum:65535
	ServicePort uint32 `json:"servicePort,omitempty"`

	// +kubebuilder:validation:Enum=TCP;UDP;SCTP
	Protocol corev1.Protocol `json:"protocol,omitempty"`
}

type ResourceRange struct {
	Min resource.Quantity `json:"min"`
	Max resource.Quantity `json:"max"`
}

type Resource struct {
	CPU    ResourceRange `json:"cpu"`
	Memory ResourceRange `json:"memory"`
}
