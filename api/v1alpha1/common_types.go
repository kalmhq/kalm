package v1alpha1

import (
	corev1 "k8s.io/api/core/v1"
)

type EnvVarType string

const (
	EnvVarTypeStatic   EnvVarType = "static"
	EnvVarTypeExternal EnvVarType = "external"
	EnvVarTypeLinked   EnvVarType = "linked"
)

// EnvVar represents an environment variable present in a Container.
type EnvVar struct {
	// Name of the environment variable. Must be a C_IDENTIFIER.
	Name string `json:"name"`

	Value string `json:"value,omitempty"`

	// +kubebuilder:validation:Enum=static;external;linked
	Type EnvVarType `json:"type,omitempty"`

	Prefix string `json:"prefix,omitempty"`

	Suffix string `json:"suffix,omitempty"`
}

type Port struct {
	Name string `json:"name"`

	// +kubebuilder:validation:Maximum:65535
	ContainerPort uint32 `json:"containerPort"`

	// ? what is service port for?
	// +kubebuilder:validation:Maximum:65535
	ServicePort uint32 `json:"servicePort,omitempty"`

	// +kubebuilder:validation:Enum=TCP;UDP;SCTP
	Protocol corev1.Protocol `json:"protocol,omitempty"`
}

type ComponentTemplateEnvType string

const (
	ComponentTemplateEnvTypeStatic   ComponentTemplateEnvType = "static"
	ComponentTemplateEnvTypeExternal ComponentTemplateEnvType = "external"
	ComponentTemplateEnvTypeLinked   ComponentTemplateEnvType = "linked"
)

type ComponentTemplateEnvVar struct {
	Name string `json:"name"`

	// +kubebuilder:validation:Enum=static;external;linked
	Type ComponentTemplateEnvType `json:"type"`

	Value string `json:"value,omitempty"`
}
