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

const (
	RoleViewer = "viewer"
	RoleEditor = "editor"
	RoleOwner  = "owner"

	// system roles can only be used in kalm-system namespace
	ClusterRoleViewer = "clusterViewer"
	ClusterRoleEditor = "clusterEditor"
	ClusterRoleOwner  = "clusterOwner"

	// Two special roles, they should exist in kalm-system namespace
	// If a subject has a rolebinding of suspended, it will lose all permissions regardless of other role bindings
	// TODO: implement this in kalm-api
	RoleSuspended = "suspended"

	// no permissions, just a placeholder to support kalm frontend
	RolePlaceholder = "placeholder"

	SubjectTypeUser  = "user"
	SubjectTypeGroup = "group"
)

type RoleBindingSpec struct {
	// +kubebuilder:validation:MinLength=1
	Subject string `json:"subject"`

	// +kubebuilder:validation:Enum=user;group
	SubjectType string `json:"subjectType"`

	// +kubebuilder:validation:Enum=viewer;editor;owner;clusterViewer;clusterEditor;clusterOwner;suspended;placeholder
	Role string `json:"role"`

	// Creator of this binding
	// +kubebuilder:validation:MinLength=1
	Creator string `json:"creator"`

	// Expire time of this key. Infinity if blank
	ExpiredAt *metav1.Time `json:"expiredAt,omitempty"`
}

// RoleBindingStatus defines the observed state of RoleBinding
type RoleBindingStatus struct{}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Subject",type="string",JSONPath=".spec.subject"
// +kubebuilder:printcolumn:name="Creator",type="string",JSONPath=".spec.creator"
// +kubebuilder:printcolumn:name="ExpiredAt",type="string",JSONPath=".spec.expiredAt"
// +kubebuilder:printcolumn:name="Age",type="date",JSONPath=".metadata.creationTimestamp"

// RoleBinding is the Schema for the deploykeys API
type RoleBinding struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   RoleBindingSpec   `json:"spec,omitempty"`
	Status RoleBindingStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:printcolumn:name="Tenant",type="string",JSONPath=".metadata.labels.tenant"
// RoleBindingList contains a list of RoleBinding
type RoleBindingList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []RoleBinding `json:"items"`
}

func init() {
	SchemeBuilder.Register(&RoleBinding{}, &RoleBindingList{})
}
