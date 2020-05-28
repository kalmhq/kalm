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

type HttpRouteConditionType string
type HttpRouteConditionOperator string
type HttpRouteCertValue string

const (
	HttpRouteConditionTypeQuery  HttpRouteConditionType = "query"
	HttpRouteConditionTypeHeader HttpRouteConditionType = "header"

	HRCOEqual       HttpRouteConditionOperator = "equal"
	HRCOWithPrefix  HttpRouteConditionOperator = "withPrefix"
	HRCOMatchRegexp HttpRouteConditionOperator = "matchRegexp"
	//HRCONotEqual       HttpRouteConditionOperator = "notEqual"
	//HRCOWithoutPrefix  HttpRouteConditionOperator = "withoutPrefix"
	//HRCONotMatchRegexp HttpRouteConditionOperator = "notMatchRegexp"

	HttpCertAuto    HttpRouteCertValue = "Auto"
	HttpCertDefault HttpRouteCertValue = "Default"
)

type HttpRouteCondition struct {
	Type     HttpRouteConditionType     `json:"type"`
	Name     string                     `json:"name"`
	Value    string                     `json:"value"`
	Operator HttpRouteConditionOperator `json:"operator"`
}

type HttpRouteDestination struct {
	Host   string `json:"host"`
	Weight int    `json:"weight"`
}

type HttpRouteRetries struct {
	Attempts             int      `json:"attempts"`
	PerTtyTimeoutSeconds int      `json:"perTtyTimeoutSeconds"`
	RetryOn              []string `json:"retryOn"`
}

type HttpRouteMirror struct {
	Percentage  int                  `json:"percentage"`
	Destination HttpRouteDestination `json:"destination"`
}

type HttpRouteDelay struct {
	Percentage   int `json:"percentage"`
	DelaySeconds int `json:"delaySeconds"`
}

type HttpRouteFault struct {
	Percentage  int `json:"percentage"`
	ErrorStatus int `json:"errorStatus"`
}

type HttpRouteCORS struct {
	AllowOrigins     []HttpRouteCondition `json:"allowOrigin"`
	AllowMethods     []string             `json:"allowMethods"`
	AllowCredentials bool                 `json:"allowCredentials"`
	AllowHeaders     []string             `json:"allowHeaders"`
	MaxAgeSeconds    int                  `json:"maxAgeSeconds"`
}

// +kubebuilder:validation:Enum=GET;HEAD;POST;PUT;PATCH;DELETE;OPTIONS;TRACE;CONNECT
type HttpRouteMethod string

// +kubebuilder:validation:Enum=http;https
type HttpRouteScheme string

// +kubebuilder:validation:MinItems=1
type HttpRouteSchemes []string

// HttpRouteSpec defines the desired state of HttpRoute
type HttpRouteSpec struct {
	// +kubebuilder:validation:MinItems=1
	Hosts []string `json:"hosts"`

	// +kubebuilder:validation:MinItems=1
	Paths []string `json:"paths"`

	// +kubebuilder:validation:MinItems=1
	Methods []HttpRouteMethod `json:"methods"`

	Schemes   HttpRouteSchemes `json:"schemes"`
	StripPath bool             `json:"stripPath,omitempty"`

	Conditions []HttpRouteCondition `json:"conditions,omitempty"`

	// +kubebuilder:validation:MinItems=1
	Destinations []HttpRouteDestination `json:"destinations"`

	// This field has no effect for now
	HttpRedirectToHttps bool `json:"httpRedirectToHttps,omitempty"`

	Timeout *int              `json:"timeout,omitempty"`
	Retries *HttpRouteRetries `json:"retries,omitempty"`

	Mirror *HttpRouteMirror `json:"mirror,omitempty"`
	Fault  *HttpRouteFault  `json:"fault,omitempty"`
	Delay  *HttpRouteDelay  `json:"delay,omitempty"`
	CORS   *HttpRouteCORS   `json:"cors,omitempty"`
}

// HttpRouteStatus defines the observed state of HttpRoute
type HttpRouteStatus struct {
	HostCertifications map[string]string `json:"hostCertifications,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status

// HttpRoute is the Schema for the httproutes API
type HttpRoute struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   HttpRouteSpec   `json:"spec,omitempty"`
	Status HttpRouteStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// HttpRouteList contains a list of HttpRoute
type HttpRouteList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []HttpRoute `json:"items"`
}

func init() {
	SchemeBuilder.Register(&HttpRoute{}, &HttpRouteList{})
}
