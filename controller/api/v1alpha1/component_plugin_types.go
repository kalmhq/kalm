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

// ComponentPluginSpec defines the desired state of ComponentPlugin
type ComponentPluginSpec struct {
	// source code of the plugin
	Src string `json:"src"`

	// This array is only useful when subject is component.
	// If empty, means the plugin can be applied on all kinds of component.
	// If Not empty, this plugin can only be used on components with workload type exists in this array.
	AvailableWorkloadType []WorkloadType `json:"availableWorkloadType,omitempty"`

	// icon of this plugin
	Icon string `json:"icon,omitempty"`

	ConfigSchema *runtime.RawExtension `json:"configSchema,omitempty"`
}

// ComponentPluginStatus defines the observed state of ComponentPlugin
type ComponentPluginStatus struct {
	CompiledSuccessfully bool `json:"compiledSuccessfully"`
}

// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Compiled",type="boolean",JSONPath=".spec.compiledSuccessfully"
// +kubebuilder:printcolumn:name="Age",type="date",JSONPath=".metadata.creationTimestamp"

// ComponentPlugin is the Schema for the plugins API
type ComponentPlugin struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ComponentPluginSpec   `json:"spec,omitempty"`
	Status ComponentPluginStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster

// ComponentPluginList contains a list of ComponentPlugin
type ComponentPluginList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []ComponentPlugin `json:"items"`
}

func init() {
	SchemeBuilder.Register(&ComponentPlugin{}, &ComponentPluginList{})
}
