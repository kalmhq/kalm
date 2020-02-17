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
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

// ComponentTemplateSpec defines the desired state of ComponentTemplate
type ComponentTemplateSpec struct {
	Name string `json:"name"`

	Env []EnvVar `json:"env,omitempty"`

	Image string `json:"image"`

	Command []string `json:"command,omitempty"`

	Args []string `json:"args,omitempty"`

	Ports []Port `json:"ports,omitempty"`

	Type ComponentType `json:"type,omitempty"`

	// +optional
	// LivenessProbe *v1.Probe `json:"livenessProbe,omitempty"`

	// +optional
	// ReadinessProbe *v1.Probe `json:"readinessProbe,omitempty"`

	Plugins []runtime.RawExtension `json:"plugins,omitempty"`

	BeforeStart []string `json:"beforeStart,omitempty"`

	AfterStart []string `json:"afterStart,omitempty"`

	BeforeDestroy []string `json:"beforeDestroy,omitempty"`

	Resources Resource `json:"resources,omitempty"`

	VolumeMounts []v1.VolumeMount `json:"volumeMounts,omitempty"`
}

// +kubebuilder:object:root=true

// ComponentTemplate is the Schema for the componenttemplates API
type ComponentTemplate struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec ComponentTemplateSpec `json:"spec,omitempty"`
}

// +kubebuilder:object:root=true

// ComponentTemplateList contains a list of ComponentTemplate
type ComponentTemplateList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []ComponentTemplate `json:"items"`
}

func init() {
	SchemeBuilder.Register(&ComponentTemplate{}, &ComponentTemplateList{})
}
