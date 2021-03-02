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
	"k8s.io/apimachinery/pkg/runtime"
)

type ExtAuthzEndpoint struct {
	Host   string `json:"host"`
	Port   int    `json:"port"`
	Scheme string `json:"scheme"`
}

type DexConnector struct {
	// +kubebuilder:validation:Required
	Type string `json:"type"`
	// +kubebuilder:validation:Required
	ID string `json:"id"`
	// +kubebuilder:validation:Required
	Name string `json:"name"`
	// +kubebuilder:validation:Required
	Config *runtime.RawExtension `json:"config"`
}

type TemporaryDexUser struct {
	Username string `json:"username"`
	// bcrypt hash of the password
	PasswordHash string `json:"passwordHash"`
	UserID       string `json:"userId"`
	Email        string `json:"email"`
}

// SingleSignOnConfigSpec defines the desired state of SingleSignOnConfig
type SingleSignOnConfigSpec struct {
	// These four are for arbitrary oidc provider
	Issuer             string `json:"issuer,omitempty"`
	IssuerClientId     string `json:"issuerClientId,omitempty"`
	IssuerClientSecret string `json:"issuerClientSecret,omitempty"`
	JwksURI            string `json:"jwksUri,omitempty"`

	// The following are for kalm dex oidc provider
	Domain string `json:"domain,omitempty"`

	// Default scheme is https, this flag is to change it to http
	UseHttp               bool `json:"useHttp,omitempty"`
	Port                  *int `json:"port,omitempty"`
	ShowApproveScreen     bool `json:"showApproveScreen,omitempty"`
	AlwaysShowLoginScreen bool `json:"alwaysShowLoginScreen,omitempty"`

	Connectors    []DexConnector    `json:"connectors,omitempty"`
	TemporaryUser *TemporaryDexUser `json:"temporaryUser,omitempty"`

	// Create service entry if the ext_authz service is running out of istio mesh
	ExternalEnvoyExtAuthz *ExtAuthzEndpoint `json:"externalEnvoyExtAuthz,omitempty"`

	IDTokenExpirySeconds *uint32 `json:"idTokenExpirySeconds,omitempty"`

	// +optional
	NeedExtraOAuthScope bool `json:"needExtraOAuthScope,omitempty"`
}

// SingleSignOnConfigStatus defines the observed state of SingleSignOnConfig
type SingleSignOnConfigStatus struct {
}

// +kubebuilder:object:root=true
// +kubebuilder:printcolumn:name="Domain",type="string",JSONPath=".spec.domain",description="Domain of dex"
// +kubebuilder:printcolumn:name="Issuer",type="string",JSONPath=".spec.issuer"
// +kubebuilder:printcolumn:name="Age",type="date",JSONPath=".metadata.creationTimestamp"

// SingleSignOnConfig is the Schema for the singlesignonconfigs API
type SingleSignOnConfig struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   SingleSignOnConfigSpec   `json:"spec,omitempty"`
	Status SingleSignOnConfigStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// SingleSignOnConfigList contains a list of SingleSignOnConfig
type SingleSignOnConfigList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []SingleSignOnConfig `json:"items"`
}

func init() {
	SchemeBuilder.Register(&SingleSignOnConfig{}, &SingleSignOnConfigList{})
}
