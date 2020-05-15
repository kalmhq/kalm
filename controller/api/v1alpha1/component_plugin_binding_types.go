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
	"crypto/md5"
	"encoding/json"
	"fmt"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

// ComponentPluginBindingSpec defines the desired state of ComponentPluginBinding
type ComponentPluginBindingSpec struct {
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

func (spec *ComponentPluginBindingSpec) GetName() string {
	bts, _ := json.Marshal(spec)
	if spec.ComponentName == "" {
		return fmt.Sprintf("%s-%x", spec.PluginName, md5.Sum(bts))
	} else {
		return fmt.Sprintf("%s-%s-%x", spec.PluginName, spec.ComponentName, md5.Sum(bts))
	}
}

// ComponentPluginBindingStatus defines the observed state of ComponentPluginBinding
type ComponentPluginBindingStatus struct {
	ConfigValid bool   `json:"configValid"`
	ConfigError string `json:"configError"`
}

// +kubebuilder:object:root=true
// +kubebuilder:printcolumn:name="Disabled",type="boolean",JSONPath=".spec.isDisabled"
// +kubebuilder:printcolumn:name="Plugin",type="string",JSONPath=".spec.pluginName"
// +kubebuilder:printcolumn:name="Component",type="string",JSONPath=".spec.componentName"
// +kubebuilder:printcolumn:name="ConfigValid",type="boolean",JSONPath=".status.configValid"
// +kubebuilder:printcolumn:name="ConfigError",type="string",JSONPath=".status.configError"
// +kubebuilder:printcolumn:name="Age",type="date",JSONPath=".metadata.creationTimestamp"

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
