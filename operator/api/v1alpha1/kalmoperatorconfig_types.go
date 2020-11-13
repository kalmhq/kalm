/*
Copyright 2020 Kalm Dev.

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

type NameValue struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type DashboardConfig struct {
	Version *string     `json:"version,omitempty"`
	Args    []string    `json:"args,omitempty"`
	Envs    []NameValue `json:"envs,omitempty"`
}

type ControllerConfig struct {
	Version *string `json:"version,omitempty"`
}

// KalmOperatorConfigSpec defines the desired state of KalmOperatorConfig
type KalmOperatorConfigSpec struct {
	SkipIstioInstallation          bool `json:"skipIstioInstallation,omitempty"`
	SkipCertManagerInstallation    bool `json:"skipCertManagerInstallation,omitempty"`
	SkipKalmControllerInstallation bool `json:"skipKalmControllerInstallation,omitempty"`
	SkipKalmDashboardInstallation  bool `json:"skipKalmDashboardInstallation,omitempty"`

	// deprecated
	KalmVersion string `json:"kalmVersion,omitempty"`

	Version string `json:"version,omitempty"`

	// Dashboard Config
	Dashboard *DashboardConfig `json:"dashboard,omitempty"`
	// Controller Config
	Controller *ControllerConfig `json:"controller,omitempty"`
}

// KalmOperatorConfigStatus defines the observed state of KalmOperatorConfig
type KalmOperatorConfigStatus struct {
}

// +kubebuilder:object:root=true

// KalmOperatorConfig is the Schema for the kalmoperatorconfigs API
type KalmOperatorConfig struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   KalmOperatorConfigSpec   `json:"spec,omitempty"`
	Status KalmOperatorConfigStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// KalmOperatorConfigList contains a list of KalmOperatorConfig
type KalmOperatorConfigList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []KalmOperatorConfig `json:"items"`
}

func init() {
	SchemeBuilder.Register(&KalmOperatorConfig{}, &KalmOperatorConfigList{})
}
