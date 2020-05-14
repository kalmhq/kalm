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

// HttpsCertSpec defines the desired state of HttpsCert
type HttpsCertSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "make" to regenerate code after modifying this file

	HttpsCertIssuer string   `json:"httpsCertIssuer"`
	Domains         []string `json:"domains"`
}

// HttpsCertStatus defines the observed state of HttpsCert
type HttpsCertStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file
	OK bool `json:"ok"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status

// HttpsCert is the Schema for the httpscerts API
type HttpsCert struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   HttpsCertSpec   `json:"spec,omitempty"`
	Status HttpsCertStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status

// HttpsCertList contains a list of HttpsCert
type HttpsCertList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []HttpsCert `json:"items"`
}

func init() {
	SchemeBuilder.Register(&HttpsCert{}, &HttpsCertList{})
}
