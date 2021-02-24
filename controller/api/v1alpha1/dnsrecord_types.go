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

type DNSType string

const (
	DNSTypeCNAME            = "CNAME"
	DNSTypeA                = "A"
	DNSTypeNS               = "NS"
	DNSTypeKalmSimpleRecord = "KalmSimpleRecord" // special record in kalm, used in local mode without external access
)

// DNSRecordSpec defines the desired state of DNSRecord
type DNSRecordSpec struct {
	Domain    string  `json:"domain,omitempty"`
	DNSType   DNSType `json:"dnsType,omitempty"`
	DNSTarget string  `json:"dnsTarget,omitempty"`
}

// DNSRecordStatus defines the observed state of DNSRecord
type DNSRecordStatus struct {
	IsConfigured bool `json:"isConfigured"`
}

// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Domain",type="string",JSONPath=".spec.domain"
// +kubebuilder:printcolumn:name="DNSType",type="string",JSONPath=".spec.dnsType"
// +kubebuilder:printcolumn:name="DNSTarget",type="string",JSONPath=".spec.dnsTarget"
// +kubebuilder:printcolumn:name="IsConfigured",type="boolean",JSONPath=".status.isConfigured"
// +kubebuilder:printcolumn:name="Age",type="date",JSONPath=".metadata.creationTimestamp"

// DNSRecord is the Schema for the dnsrecords API
type DNSRecord struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   DNSRecordSpec   `json:"spec,omitempty"`
	Status DNSRecordStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// DNSRecordList contains a list of DNSRecord
type DNSRecordList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []DNSRecord `json:"items"`
}

func init() {
	SchemeBuilder.Register(&DNSRecord{}, &DNSRecordList{})
}
