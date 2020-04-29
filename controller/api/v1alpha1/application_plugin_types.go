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

// ApplicationPluginSpec defines the desired state of ApplicationPlugin
type ApplicationPluginSpec struct {
	// source code of the plugin
	Src string `json:"src"`

	// icon of this plugin
	Icon string `json:"icon,omitempty"`

	ConfigSchema *runtime.RawExtension `json:"configSchema,omitempty"`
}

// ApplicationPluginStatus defines the observed state of ApplicationPlugin
type ApplicationPluginStatus struct {
	CompiledSuccessfully bool `json:"compiledSuccessfully"`
}

// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster
// +kubebuilder:subresource:status

// ApplicationPlugin is the Schema for the applicationplugins API
type ApplicationPlugin struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ApplicationPluginSpec   `json:"spec,omitempty"`
	Status ApplicationPluginStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster
// +kubebuilder:subresource:status

// ApplicationPluginList contains a list of ApplicationPlugin
type ApplicationPluginList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []ApplicationPlugin `json:"items"`
}

func init() {
	SchemeBuilder.Register(&ApplicationPlugin{}, &ApplicationPluginList{})
}
