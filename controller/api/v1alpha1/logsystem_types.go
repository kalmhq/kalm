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
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type LogSystemStack string

const (
	LogSystemStackPLGMonolithic LogSystemStack = "plg-monolithic"

	LokiImage     string = "grafana/loki:1.6.0"
	GrafanaImage  string = "grafana/grafana:6.7.0"
	PromtailImage string = "grafana/promtail:1.6.0"

	DefaultLokiDiskSize = "10Gi"
)

type LokiConfig struct {
	// Zero means disable retention.
	// If it's not zero, this value will affect
	//   table_manager.retention_deletes_enabled to be true
	//   table_manager.retention_period
	//   chunk_store_config.max_look_back_period
	//   period_config.index.period
	// Read more:
	//   https://grafana.com/docs/loki/latest/operations/storage/table-manager/
	//   https://grafana.com/docs/loki/latest/operations/storage/retention/
	RetentionDays uint32 `json:"retentionDays"`

	// only works when stack is plg-monolithic
	DiskSize *resource.Quantity `json:"diskSize,omitempty"`

	// only works when stack is plg-monolithic
	StorageClass *string `json:"storageClass,omitempty"`

	// lock the image, which make loki will not update unexpectedly after kalm is upgraded.
	Image string `json:"image"`
}

type GrafanaConfig struct {
	// lock the image, which make the image will not update unexpectedly after kalm is upgraded.
	Image string `json:"image"`
}

type PromtailConfig struct {
	// lock the image, which make the image will not update unexpectedly after kalm is upgraded.
	Image string `json:"image"`
}

// This is a high level config of plg. The real plg config is generated based on this struct
type PLGConfig struct {
	Loki     *LokiConfig     `json:"loki"`
	Grafana  *GrafanaConfig  `json:"grafana"`
	Promtail *PromtailConfig `json:"promtail"`
}

// LogSystemSpec defines the desired state oLogSystemf
type LogSystemSpec struct {
	// +kubebuilder:validation:Enum=plg-monolithic
	Stack LogSystemStack `json:"stack"`

	// Need to exist if the stack is plg-*
	PLGConfig *PLGConfig `json:"plgConfig,omitempty"`

	// This sc will be used in pvc template if a disk is required. This value can be overwrite from deeper struct attribute.
	StorageClass *string `json:"storageClass,omitempty"`
}

// LogSystemStatus defines the observed state oLogSystemf
type LogSystemStatus struct {
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Stack",type="string",JSONPath=".spec.stack"

// LogSystem is the Schema for the deploykeys API
type LogSystem struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   LogSystemSpec   `json:"spec,omitempty"`
	Status LogSystemStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// LogSystemList contains a list oLogSystemf
type LogSystemList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []LogSystem `json:"items"`
}

func init() {
	SchemeBuilder.Register(&LogSystem{}, &LogSystemList{})
}
