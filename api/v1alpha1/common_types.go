package v1alpha1

// EnvVar represents an environment variable present in a Container.
type EnvVar struct {
	// Name of the environment variable. Must be a C_IDENTIFIER.
	Name string `json:"name"`

	Value string `json:"value"`
}

type PortProtocolType string

var (
	PortProtocolTypeHttp PortProtocolType = "http"
	PortProtocolTypeTCP  PortProtocolType = "tcp"
)

type Port struct {
	Name string `json:"name"`

	// +kubebuilder:validation:Maximum:65535
	ExposedPort uint32 `json:"exposedPort"`

	// +kubebuilder:validation:Maximum:65535
	ServicePort uint32 `json:"servicePort,omitempty"`

	// +kubebuilder:validation:Enum=http;tcp
	Protocol PortProtocolType `json:"protocol,omitempty"`
}
