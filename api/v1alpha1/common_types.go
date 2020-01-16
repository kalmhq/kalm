package v1alpha1

import corev1 "k8s.io/api/core/v1"

// EnvVar represents an environment variable present in a Container.
type EnvVar struct {
	// Name of the environment variable. Must be a C_IDENTIFIER.
	Name string `json:"name"`

	Value string `json:"value"`
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
