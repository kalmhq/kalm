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

// ACMEServerSpec defines the desired state of ACMEServer
type ACMEServerSpec struct {
	// sub-domains of this will server TXT record for DNS-Challenge
	// +kubebuilder:validation:MinLength=1
	ACMEDomain string `json:"acmeDomain,omitempty"`

	// act as NameServer for us,
	// the NS record should be: ACMEDomain -> NSDomain
	// +kubebuilder:validation:MinLength=1
	NSDomain string `json:"nsDomain,omitempty"`
}

// ACMEServerStatus defines the observed state of ACMEServer
type ACMEServerStatus struct {
	Ready              bool   `json:"ready"`
	NameServerIP       string `json:"nameServerIP,omitempty"`
	NameServerHostname string `json:"nameServerHostname,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Age",type="date",JSONPath=".metadata.creationTimestamp"

// ACMEServer is the Schema for the acmeservers API
type ACMEServer struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ACMEServerSpec   `json:"spec,omitempty"`
	Status ACMEServerStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// ACMEServerList contains a list of ACMEServer
type ACMEServerList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []ACMEServer `json:"items"`
}

func init() {
	SchemeBuilder.Register(&ACMEServer{}, &ACMEServerList{})
}
