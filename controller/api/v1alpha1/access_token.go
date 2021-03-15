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

type AccessTokenVerb string

const (
	AccessTokenVerbView   AccessTokenVerb = "view"
	AccessTokenVerbEdit   AccessTokenVerb = "edit"
	AccessTokenVerbManage AccessTokenVerb = "manage"
)

type AccessTokenRule struct {
	// +kubebuilder:validation:Enum=view;edit;manage
	Verb AccessTokenVerb `json:"verb"`

	// +kubebuilder:validation:MinLength=1
	Namespace string `json:"namespace"`

	// +kubebuilder:validation:MinLength=1
	Kind string `json:"kind"`

	// +kubebuilder:validation:MinLength=1
	Name string `json:"name"`
}

// A model to describe general access token permissions
// It's designed to be easy to translate to casbin policies.
// This model should NOT be generate manually through kubernetes api directly.
// Instead, use kalm apis to manage records.
type AccessTokenSpec struct {
	Memo string `json:"memo,omitempty"`

	// The token, the access token name should be sha256 of this token.
	// +kubebuilder:validation:MinLength=64
	Token string `json:"token"`

	// Rules of this key
	// +kubebuilder:validation:MinItems=1
	Rules []AccessTokenRule `json:"rules"`

	// Creator of this key
	// +kubebuilder:validation:MinLength=1
	Creator string `json:"creator"`

	// Expire time of this key. Infinity if blank
	ExpiredAt *metav1.Time `json:"expiredAt,omitempty"`
}

// AccessTokenStatus defines the observed state of AccessTokeny
type AccessTokenStatus struct {
	LastUsedAt int `json:"lastUsedAt"`
	UsedCount  int `json:"usedCount"`
}

// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Type",type="string",JSONPath=".metadata.labels.tokenType"
// +kubebuilder:printcolumn:name="Creator",type="string",JSONPath=".spec.creator"
// +kubebuilder:printcolumn:name="ExpiredAt",type="string",JSONPath=".spec.expiredAt"
// +kubebuilder:printcolumn:name="Age",type="date",JSONPath=".metadata.creationTimestamp"

// AccessToken is the Schema for the deploykeys API
type AccessToken struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   AccessTokenSpec   `json:"spec,omitempty"`
	Status AccessTokenStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true
// AccessTokenList contains a list of AccessToken
type AccessTokenList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []AccessToken `json:"items"`
}

func init() {
	SchemeBuilder.Register(&AccessToken{}, &AccessTokenList{})
}
