/*

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package v1alpha1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

// ComponentPluginBindingSpec defines the desired state of ComponentPluginBinding
type ComponentPluginBindingSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "make" to regenerate code after modifying this file

	// If this field is empty, it will affect all components in the application.
	ComponentName string `json:"componentName,omitempty"`

	// which plugin to use
	PluginName string `json:"pluginName"`

	// configuration of this binding
	Config *runtime.RawExtension `json:"config,omitempty"`

	// disable this pluginbinding
	// +optional
	IsDisabled bool `json:"isDisabled"`
}

// ComponentPluginBindingStatus defines the observed state of ComponentPluginBinding
type ComponentPluginBindingStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file
	ConfigValid bool   `json:"configValid"`
	ConfigError string `json:"configError"`
}

// +kubebuilder:object:root=true

// ComponentPluginBinding is the Schema for the pluginbindings API
type ComponentPluginBinding struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ComponentPluginBindingSpec   `json:"spec,omitempty"`
	Status ComponentPluginBindingStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// ComponentPluginBindingList contains a list of ComponentPluginBinding
type ComponentPluginBindingList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []ComponentPluginBinding `json:"items"`
}

func init() {
	SchemeBuilder.Register(&ComponentPluginBinding{}, &ComponentPluginBindingList{})
}
