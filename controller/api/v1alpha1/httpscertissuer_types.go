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

// HttpsCertIssuerSpec defines the desired state of HttpsCertIssuer
type HttpsCertIssuerSpec struct {
	// +optional
	CAForTest *CAForTestIssuer `json:"caForTest,omitempty"`
	// +optional
	ACMECloudFlare *ACMECloudFlareIssuer `json:"acmeCloudFlare,omitempty"`
	// +optional
	HTTP01 *HTTP01Issuer `json:"http01,omitempty"`
	// +optional
	DNS01 *DNS01Issuer `json:"dns01,omitempty"`
}

type CAForTestIssuer struct{}

type ACMECloudFlareIssuer struct {
	// +kubebuilder:validation:MinLength=1
	Email string `json:"email"`
	// +kubebuilder:validation:MinLength=1
	APITokenSecretName string `json:"apiTokenSecretName"`
}

type HTTP01Issuer struct {
	// +optional
	Email string `json:"email,omitempty"`
}

type DNS01Issuer struct {
	BaseACMEDomain string                       `json:"baseACMEDomain"`
	Configs        map[string]DNS01IssuerConfig `json:"configs"`
}

type DNS01IssuerConfig struct {
	UserName   string `json:"username"`
	Password   string `json:"password"`
	FullDomain string `json:"fulldomain"`
	SubDomain  string `json:"subdomain"`
	// +optional
	AllowFrom []string `json:"allowfrom,omitempty"`
}

// HttpsCertIssuerStatus defines the observed state of HttpsCertIssuer
type HttpsCertIssuerStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file
	OK bool `json:"ok"`
}

// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster
// +kubebuilder:subresource:status

// HttpsCertIssuer is the Schema for the httpscertissuers API
type HttpsCertIssuer struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   HttpsCertIssuerSpec   `json:"spec,omitempty"`
	Status HttpsCertIssuerStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="ok",type="boolean",JSONPath=".status.ok"
// +kubebuilder:printcolumn:name="Age",type="date",JSONPath=".metadata.creationTimestamp"

// HttpsCertIssuerList contains a list of HttpsCertIssuer
type HttpsCertIssuerList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []HttpsCertIssuer `json:"items"`
}

func init() {
	SchemeBuilder.Register(&HttpsCertIssuer{}, &HttpsCertIssuerList{})
}
