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

// ApplicationPluginBindingSpec defines the desired state of ApplicationPluginBinding
type ApplicationPluginBindingSpec struct {
	// which plugin to use
	PluginName string `json:"pluginName"`

	// configuration of this binding
	Config *runtime.RawExtension `json:"config,omitempty"`

	// disable this binding
	// +optional
	IsDisabled bool `json:"isDisabled"`
}

// ApplicationPluginBindingStatus defines the observed state of ApplicationPluginBinding
type ApplicationPluginBindingStatus struct {
	ConfigValid bool   `json:"configValid"`
	ConfigError string `json:"configError"`
}

// +kubebuilder:object:root=true

// ApplicationPluginBinding is the Schema for the applicationpluginbindings API
type ApplicationPluginBinding struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ApplicationPluginBindingSpec   `json:"spec,omitempty"`
	Status ApplicationPluginBindingStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// ApplicationPluginBindingList contains a list of ApplicationPluginBinding
type ApplicationPluginBindingList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []ApplicationPluginBinding `json:"items"`
}

func init() {
	SchemeBuilder.Register(&ApplicationPluginBinding{}, &ApplicationPluginBindingList{})
}
