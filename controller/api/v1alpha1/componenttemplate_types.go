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
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

type WorkLoadType string

const (
	WorkLoadTypeServer  WorkLoadType = "server"
	WorkLoadTypeCronjob WorkLoadType = "cronjob"
)

// ComponentTemplateSpec defines the desired state of ComponentTemplate
type ComponentTemplateSpec struct {
	Name string `json:"name"`

	Env []EnvVar `json:"env,omitempty"`

	Image string `json:"image"`

	Command []string `json:"command,omitempty"`

	Args []string `json:"args,omitempty"`

	Ports []Port `json:"ports,omitempty"`

	// +optional
	// LivenessProbe *v1.Probe `json:"livenessProbe,omitempty"`

	// +optional
	// ReadinessProbe *v1.Probe `json:"readinessProbe,omitempty"`

	// +kubebuilder:validation:Enum=server;cronjob
	WorkLoadType WorkLoadType `json:"workloadType,omitempty"`

	Schedule string `json:"schedule,omitempty"`

	BeforeStart []string `json:"beforeStart,omitempty"`

	AfterStart []string `json:"afterStart,omitempty"`

	BeforeDestroy []string `json:"beforeDestroy,omitempty"`

	CPU resource.Quantity `json:"cpu,omitempty"`

	Memory resource.Quantity `json:"memory,omitempty"`

	VolumeMounts []v1.VolumeMount `json:"volumeMounts,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster

// ComponentTemplate is the Schema for the componenttemplates API
type ComponentTemplate struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec ComponentTemplateSpec `json:"spec,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster

// ComponentTemplateList contains a list of ComponentTemplate
type ComponentTemplateList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []ComponentTemplate `json:"items"`
}

func init() {
	SchemeBuilder.Register(&ComponentTemplate{}, &ComponentTemplateList{})
}
