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
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var DefaultHTTP01IssuerName = "default-http01-issuer"
var DefaultDNS01IssuerName = "default-dns01-issuer"
var DefaultCAIssuerName = "default-cert-issuer"

// HttpsCertSpec defines the desired state of HttpsCert
type HttpsCertSpec struct {
	IsSelfManaged             bool   `json:"isSelfManaged,omitempty"`
	SelfManagedCertSecretName string `json:"selfManagedCertSecretName,omitempty"`
	HttpsCertIssuer           string `json:"httpsCertIssuer,omitempty"`

	// +kubebuilder:validation:MinItems=1
	Domains []string `json:"domains"`
}

// HttpsCertStatus defines the observed state of HttpsCert
type HttpsCertStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file

	// +optional
	Conditions []HttpsCertCondition `json:"conditions,omitempty"`
	// +optional
	ExpireTimestamp int64 `json:"expireTimestamp"`
	// +optional
	IsSignedByPublicTrustedCA bool `json:"isSignedByTrustedCA"`
	// +optional
	WildcardCertDNSChallengeDomainMap map[string]string `json:"wildcardCertDNSChallengeDomainMap,omitempty"`
}

type HttpsCertConditionType string

const (
	HttpsCertConditionReady HttpsCertConditionType = "Ready"
)

type HttpsCertCondition struct {
	// Type of the condition, currently ('Ready').
	Type HttpsCertConditionType `json:"type"`

	// Status of the condition, one of ('True', 'False', 'Unknown').
	Status corev1.ConditionStatus `json:"status"`

	// Reason is a brief machine readable explanation for the condition's last
	// transition.
	// +optional
	Reason string `json:"reason,omitempty"`

	// Message is a human readable description of the details of the last
	// transition, complementing reason.
	// +optional
	Message string `json:"message,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Ready",type=string,JSONPath=`.status.conditions[0].status`
// +kubebuilder:printcolumn:name="Message",type=string,JSONPath=`.status.conditions[0].message`
// +kubebuilder:printcolumn:name="Age",type="date",JSONPath=".metadata.creationTimestamp"

// HttpsCert is the Schema for the httpscerts API
type HttpsCert struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   HttpsCertSpec   `json:"spec,omitempty"`
	Status HttpsCertStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster
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

func IsHttpsCertReady(cert HttpsCert) bool {
	for _, cond := range cert.Status.Conditions {
		if cond.Type != HttpsCertConditionReady {
			continue
		}

		return cond.Status == corev1.ConditionTrue
	}

	return false
}
