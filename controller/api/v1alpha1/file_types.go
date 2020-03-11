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

// FileSpec defines the desired state of File
type FileSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "make" to regenerate code after modifying this file
	// Standard object's metadata.

	Path    string `json:"path"`
	Content string `json:"content"`
}

type FileStatus struct {
	LastPath string `json:"lastPath,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status

// File is the Schema for the files API
type File struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`
	Spec              FileSpec   `json:"spec,omitempty"`
	Status            FileStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// FileList contains a list of File
type FileList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []File `json:"items"`
}

func init() {
	SchemeBuilder.Register(&File{}, &FileList{})
}
