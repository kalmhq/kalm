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
)

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

type DeployKeyScope string

const (
	DeployKeyTypeComponent DeployKeyScope = "component"
	DeployKeyTypeNamespace DeployKeyScope = "namespace"
	DeployKeyTypeCluster   DeployKeyScope = "cluster"
)

// DeployKeySpec defines the desired state of DeployKey
type DeployKeySpec struct {
	// +kubebuilder:validation:Enum=component;namespace;cluster
	Scope DeployKeyScope `json:"scope"`

	// If scope is cluster, this field will be ignored
	// If scope is namespace, this is a list of namespace names
	// If scope is component, this is a list of components under namespaces (ns1/component1, n2/component2)
	// +optional
	Resources []string `json:"resources,omitempty"`

	// +optional
	Creator string `json:"creator,omitempty"`
}

// DeployKeyStatus defines the observed state of DeployKey
type DeployKeyStatus struct {
	ServiceAccountToken string `json:"serviceAccountToken"`
	LastUsedTimestamp   int    `json:"lastUsedTimestamp"`
	UsedCount           int    `json:"usedCount"`
}

// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Scope",type="string",JSONPath=".spec.scope"
// +kubebuilder:printcolumn:name="Resources",type="string",JSONPath=".spec.resources"

// DeployKey is the Schema for the deploykeys API
type DeployKey struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   DeployKeySpec   `json:"spec,omitempty"`
	Status DeployKeyStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// DeployKeyList contains a list of DeployKey
type DeployKeyList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []DeployKey `json:"items"`
}

func init() {
	SchemeBuilder.Register(&DeployKey{}, &DeployKeyList{})
}
