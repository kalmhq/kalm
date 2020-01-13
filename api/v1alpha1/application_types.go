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
	"k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

// +kubebuilder:validation:Enum=Server;Cronjob
type ComponentType string

const (
	ComponentTypeServer ComponentType = "Server"

	ComponentTypeCronjob ComponentType = "Cronjob"
)

type ComponentSpec struct {
	Name string `json:"name"`

	Envs []EnvVar `json:"envs,omitempty"`

	Image string `json:"image"`

	Command string `json:"command,omitempty"`

	Requirements v1.ResourceRequirements `json:"resources,omitempty"`

	Type ComponentType `json:"type,omitempty"`

	// +optional
	LivenessProbe *v1.Probe `json:"livenessProbe,omitempty"`

	// +optional
	ReadinessProbe *v1.Probe `json:"readinessProbe,omitempty"`

	Plugins []PluginBinding `json:"plugins,omitempty"`
}

// ApplicationSpec defines the desired state of Application
type ApplicationSpec struct {
	Components []ComponentSpec `json:"components"`
}

// ApplicationStatus defines the observed state of Application
type ApplicationStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file
}

// +kubebuilder:object:root=true

// Application is the Schema for the applications API
type Application struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ApplicationSpec   `json:"spec,omitempty"`
	Status ApplicationStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// ApplicationList contains a list of Application
type ApplicationList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Application `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Application{}, &ApplicationList{})
}
