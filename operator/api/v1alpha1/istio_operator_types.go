package v1alpha1

import (
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

// +kubebuilder:object:root=true

type IstioOperator struct {
	metaV1.TypeMeta `json:",inline"`
	// +optional
	metaV1.ObjectMeta `json:"metadata,omitempty"`

	// Spec defines the implementation of this definition.
	// +optional
	Spec runtime.RawExtension `json:"spec,omitempty"`
}

// +kubebuilder:object:root=true

// KalmOperatorConfigList contains a list of KalmOperatorConfig
type IstioOperatorList struct {
	metaV1.TypeMeta `json:",inline"`
	metaV1.ListMeta `json:"metadata,omitempty"`
	Items           []IstioOperator `json:"items"`
}
