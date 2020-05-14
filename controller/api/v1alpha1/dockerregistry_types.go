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

// DockerRegistrySpec defines the desired state of DockerRegistry
type DockerRegistrySpec struct {
	Host                   string `json:"host"`
	PoolingIntervalSeconds *int   `json:"poolingIntervalSeconds,omitempty"`
}

type RepositoryTag struct {
	Name           string `json:"name"`
	Manifest       string `json:"manifest"`
	TimeCreatedMs  string `json:"timeCreatedMs"`
	TimeUploadedMs string `json:"timeUploadedMs"`
}

type Repository struct {
	Name string          `json:"name"`
	Tags []RepositoryTag `json:"tags"`
}

// DockerRegistryStatus defines the observed state of DockerRegistry
type DockerRegistryStatus struct {
	AuthenticationVerified bool          `json:"authenticationVerified"`
	Repositories           []*Repository `json:"repositories"`
}

// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster

// DockerRegistry is the Schema for the dockerregistries API
type DockerRegistry struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   DockerRegistrySpec   `json:"spec,omitempty"`
	Status DockerRegistryStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster

// DockerRegistryList contains a list of DockerRegistry
type DockerRegistryList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []DockerRegistry `json:"items"`
}

func init() {
	SchemeBuilder.Register(&DockerRegistry{}, &DockerRegistryList{})
}
