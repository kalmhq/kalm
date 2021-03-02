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
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

const (
	KalmLabelNamespaceKey = "kalm-namespace"

	KalmLabelComponentKey        = "kalm-component"
	KalmLabelKeyExceedingQuota   = "kalm-exceeding-quota"
	KalmLabelKeyOriginalReplicas = "kalm-original-replicas"
)

type PreInjectFile struct {
	// the content of the file
	// +kubebuilder:validation:MinLength=1
	Content string `json:"content"`

	// To support binary content, it allows set base64 encoded data into `Content` field
	// and set this flag to `true`. Binary data will be restored instead of plain string in `Content`.
	Base64 bool `json:"base64,omitempty"`

	// +kubebuilder:validation:MinLength=1
	MountPath string `json:"mountPath"`

	Readonly bool `json:"readonly,omitempty"`

	Runnable bool `json:"runnable"`
}

// ComponentSpec defines the desired state of Component
type ComponentSpec struct {
	// labels will add to pods
	Labels map[string]string `json:"labels,omitempty"`

	// annotations will add to pods
	Annotations map[string]string `json:"Annotations,omitempty"`

	Env []EnvVar `json:"env,omitempty"`

	// +kubebuilder:validation:Required
	// +kubebuilder:validation:MinLength=1
	Image string `json:"image"`

	Replicas *int32 `json:"replicas,omitempty"`

	NodeSelectorLabels map[string]string `json:"nodeSelectorLabels,omitempty"`
	PreferNotCoLocated bool              `json:"preferNotCoLocated,omitempty"`

	StartAfterComponents []string `json:"startAfterComponents,omitempty"`

	Command string `json:"command,omitempty"`

	// +optional
	EnableHeadlessService bool `json:"enableHeadlessService,omitempty"`

	Ports []Port `json:"ports,omitempty"`

	// +kubebuilder:validation:Enum=server;cronjob;statefulset;daemonset
	WorkloadType WorkloadType `json:"workloadType,omitempty"`

	Schedule string `json:"schedule,omitempty"`

	// +k8s:openapi-gen=true
	// +optional
	LivenessProbe *v1.Probe `json:"livenessProbe,omitempty"`

	// +optional
	ReadinessProbe *v1.Probe `json:"readinessProbe,omitempty"`

	// +optional
	ResourceRequirements *v1.ResourceRequirements `json:"resourceRequirements,omitempty"`
	// +optional
	IstioResourceRequirements *v1.ResourceRequirements `json:"istioResourceRequirements,omitempty"`

	TerminationGracePeriodSeconds *int64 `json:"terminationGracePeriodSeconds,omitempty"`

	// +optional
	// +kubebuilder:validation:Enum=ClusterFirstWithHostNet;ClusterFirst;Default;None
	DnsPolicy v1.DNSPolicy `json:"dnsPolicy,omitempty"`

	// +kubebuilder:validation:Enum=Always;OnFailure;Never
	RestartPolicy v1.RestartPolicy `json:"restartPolicy,omitempty"`

	// +kubebuilder:validation:Enum=Recreate;RollingUpdate
	RestartStrategy apps1.DeploymentStrategyType `json:"restartStrategy,omitempty"`

	// +optional
	Volumes []Volume `json:"volumes,omitempty"`

	RunnerPermission *RunnerPermission `json:"runnerPermission,omitempty"`

	PreInjectedFiles []PreInjectFile `json:"preInjectedFiles,omitempty"`

	// This is only meaningful if this component is a cronjob workload.
	// Controller should immediately trigger a job and set its value to false if it's true.
	ImmediateTrigger bool `json:"immediateTrigger,omitempty"`
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
