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

// +kubebuilder:validation:Enum=query;header
type HttpRouteConditionType string

// +kubebuilder:validation:Enum=equal;withPrefix;matchRegexp
type HttpRouteConditionOperator string

//type HttpRouteCertValue string

const (
	HttpRouteConditionTypeQuery  HttpRouteConditionType = "query"
	HttpRouteConditionTypeHeader HttpRouteConditionType = "header"

	HRCOEqual       HttpRouteConditionOperator = "equal"
	HRCOWithPrefix  HttpRouteConditionOperator = "withPrefix"
	HRCOMatchRegexp HttpRouteConditionOperator = "matchRegexp"
	//HRCONotEqual       HttpRouteConditionOperator = "notEqual"
	//HRCOWithoutPrefix  HttpRouteConditionOperator = "withoutPrefix"
	//HRCONotMatchRegexp HttpRouteConditionOperator = "notMatchRegexp"

	//HttpCertAuto    HttpRouteCertValue = "Auto"
	//HttpCertDefault HttpRouteCertValue = "Default"
)

type HttpRouteCondition struct {
	// +kubebuilder:validation:Enum=query;header
	Type HttpRouteConditionType `json:"type"`

	// +kubebuilder:validation:MinLength=1
	Name string `json:"name"`

	Value string `json:"value"`

	// +kubebuilder:validation:Enum=equal;withPrefix;matchRegexp
	Operator HttpRouteConditionOperator `json:"operator"`
}

type HttpRouteDestination struct {
	// +kubebuilder:validation:MinLength=1
	Host string `json:"host"`
	// +kubebuilder:validation:Minimum=0
	Weight int `json:"weight"`
}

type HttpRouteRetries struct {
	// +kubebuilder:validation:Minimum=0
	Attempts int `json:"attempts"`
	// +kubebuilder:validation:Minimum=1
	PerTtyTimeoutSeconds int      `json:"perTtyTimeoutSeconds"`
	RetryOn              []string `json:"retryOn"`
}

type HttpRouteMirror struct {
	// +kubebuilder:validation:Minimum=0
	Percentage  int                  `json:"percentage"`
	Destination HttpRouteDestination `json:"destination"`
}

type HttpRouteDelay struct {
	// +kubebuilder:validation:Minimum=0
	Percentage int `json:"percentage"`
	// +kubebuilder:validation:Minimum=1
	DelaySeconds int `json:"delaySeconds"`
}

type HttpRouteFault struct {
	// +kubebuilder:validation:Minimum=0
	Percentage  int `json:"percentage"`
	ErrorStatus int `json:"errorStatus"`
}

type HttpRouteCORS struct {
	AllowOrigins     []string `json:"allowOrigins,omitempty"`
	AllowMethods     []string `json:"allowMethods,omitempty"`
	AllowCredentials bool     `json:"allowCredentials,omitempty"`
	AllowHeaders     []string `json:"allowHeaders,omitempty"`
	MaxAgeSeconds    *int     `json:"maxAgeSeconds,omitempty"`
}

// +kubebuilder:validation:Enum=GET;HEAD;POST;PUT;PATCH;DELETE;OPTIONS;TRACE;CONNECT
type AllowMethod string

// +kubebuilder:validation:Enum=GET;HEAD;POST;PUT;PATCH;DELETE;OPTIONS;TRACE;CONNECT
type HttpRouteMethod string

// +kubebuilder:validation:Enum=http;https
type HttpRouteScheme string

//type HttpRouteSchemes []HttpRouteScheme

// HttpRouteSpec defines the desired state of HttpRoute
type HttpRouteSpec struct {
	// +kubebuilder:validation:MinItems=1
	Hosts []string `json:"hosts"`

	// +kubebuilder:validation:MinItems=1
	Paths []string `json:"paths"`

	// +kubebuilder:validation:MinItems=1
	Methods []HttpRouteMethod `json:"methods"`

	// +kubebuilder:validation:MinItems=1
	Schemes []HttpRouteScheme `json:"schemes"`

	StripPath bool `json:"stripPath,omitempty"`

	Conditions []HttpRouteCondition `json:"conditions,omitempty"`

	// +kubebuilder:validation:MinItems=1
	Destinations []HttpRouteDestination `json:"destinations"`

	HttpRedirectToHttps bool `json:"httpRedirectToHttps,omitempty"`

	Timeout *int              `json:"timeout,omitempty"`
	Retries *HttpRouteRetries `json:"retries,omitempty"`

	Mirror *HttpRouteMirror `json:"mirror,omitempty"`
	Fault  *HttpRouteFault  `json:"fault,omitempty"`
	Delay  *HttpRouteDelay  `json:"delay,omitempty"`
	CORS   *HttpRouteCORS   `json:"cors,omitempty"`
}

type HttpRouteDestinationStatus struct {
	DestinationHost string `json:"destinationHost"`
	Status          string `json:"status"`
	Error           string `json:"error,omitempty"`
}

// HttpRouteStatus defines the observed state of HttpRoute
type HttpRouteStatus struct {
	HostCertifications map[string]string            `json:"hostCertifications,omitempty"`
	DestinationsStatus []HttpRouteDestinationStatus `json:"destinationsStatus"`
}

// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Hosts",type="string",JSONPath=".spec.hosts"
// +kubebuilder:printcolumn:name="Paths",type="string",JSONPath=".spec.paths"
// +kubebuilder:printcolumn:name="Age",type="date",JSONPath=".metadata.creationTimestamp"

// HttpRoute is the Schema for the httproutes API
type HttpRoute struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   HttpRouteSpec   `json:"spec,omitempty"`
	Status HttpRouteStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster
// HttpRouteList contains a list of HttpRoute
type HttpRouteList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []HttpRoute `json:"items"`
}

func init() {
	SchemeBuilder.Register(&HttpRoute{}, &HttpRouteList{})
}
