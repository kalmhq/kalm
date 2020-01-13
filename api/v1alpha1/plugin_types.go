package v1alpha1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

type PluginBindingStatus struct {
}

type PluginBinding struct {
	Name       string               `json:"name"`
	Properties runtime.RawExtension `json:"properties,omitempty"`
	Status     PluginBindingStatus  `json:"status,omitempty"`
}

type PluginSpec struct {
	Type       string               `json:"type"`
	Properties runtime.RawExtension `json:"properties,omitempty"`
}

type PluginStatus struct{}

type Plugin struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   PluginSpec   `json:"spec,omitempty"`
	Status PluginStatus `json:"status,omitempty"`
}

type PluginList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Plugin `json:"items"`
}

type PluginImplementationManualScale struct {
	Type       string               `json:"type"`
	Properties runtime.RawExtension `json:"properties"`
}
