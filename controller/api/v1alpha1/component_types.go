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
	apps1 "k8s.io/api/apps/v1"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

const (
	PodAffinityTypePreferFanout PodAffinityType = "prefer-fanout" // multi host
	PodAffinityTypePreferGather PodAffinityType = "prefer-gather" //same host
)

type PodAffinityType string

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

// ComponentSpec defines the desired state of Component
type ComponentSpec struct {
	Env []EnvVar `json:"env,omitempty"`

	// +kubebuilder:validation:Required
	Image string `json:"image"`

	Replicas *int32 `json:"replicas,omitempty"`

	PodAffinityType    PodAffinityType   `json:"podAffinityType,omitempty"`
	NodeSelectorLabels map[string]string `json:"nodeSelectorLabels,omitempty"`

	StartAfterComponents []string `json:"startAfterComponents,omitempty"`

	Command []string `json:"command,omitempty"`

	Args []string `json:"args,omitempty"`

	Ports []Port `json:"ports,omitempty"`

	// +kubebuilder:validation:Enum=server;cronjob;statefulset;daemonset
	WorkloadType WorkloadType `json:"workloadType,omitempty"`

	Schedule string `json:"schedule,omitempty"`

	// +k8s:openapi-gen=true
	// +optional
	LivenessProbe *v1.Probe `json:"livenessProbe,omitempty"`

	// +optional
	ReadinessProbe *v1.Probe `json:"readinessProbe,omitempty"`

	BeforeStart []string `json:"beforeStart,omitempty"`

	AfterStart []string `json:"afterStart,omitempty"`

	BeforeDestroy []string `json:"beforeDestroy,omitempty"`

	CPU *resource.Quantity `json:"cpu,omitempty"`

	Memory *resource.Quantity `json:"memory,omitempty"`

	TerminationGracePeriodSeconds *int64 `json:"terminationGracePeriodSeconds,omitempty"`

	// +optional
	DnsPolicy v1.DNSPolicy `json:"dnsPolicy,omitempty"`

	RestartPolicy v1.RestartPolicy `json:"restartPolicy,omitempty"`

	RestartStrategy apps1.DeploymentStrategyType `json:"restartStrategy,omitempty"`

	// +optional
	Configs       []Config       `json:"configs,omitempty"`
	DirectConfigs []DirectConfig `json:"directConfigs,omitempty"`

	// +optional
	Volumes []Volume `json:"volumes,omitempty"`

	RunnerPermission *RunnerPermission `json:"runnerPermission,omitempty"`
}

// ComponentStatus defines the observed state of Component
type ComponentStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file
}

// +kubebuilder:object:root=true
// +kubebuilder:printcolumn:name="Workload",type="string",JSONPath=".spec.workloadType"
// +kubebuilder:printcolumn:name="Image",type="string",JSONPath=".spec.image"
// +kubebuilder:printcolumn:name="Age",type="date",JSONPath=".metadata.creationTimestamp"

// Component is the Schema for the components API
type Component struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ComponentSpec   `json:"spec,omitempty"`
	Status ComponentStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// ComponentList contains a list of Component
type ComponentList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Component `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Component{}, &ComponentList{})
}
