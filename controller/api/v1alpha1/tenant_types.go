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
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

const (
	TenantNameLabelKey      = "tenant"
	DefaultGlobalTenantName = "fake"
)

type ResourceName string

const (
	ResourceCPU               ResourceName = "cpu"
	ResourceMemory            ResourceName = "memory"
	ResourceStorage           ResourceName = "storage"
	ResourceEphemeralStorage  ResourceName = "ephemeralStorage"
	ResourceTraffic           ResourceName = "traffic"
	ResourceApplicationsCount ResourceName = "applicationsCount"
	ResourceComponentsCount   ResourceName = "componentsCount"
	ResourceServicesCount     ResourceName = "servicesCount"
	ResourceUsersCount        ResourceName = "usersCount"
	ResourceAccessTokensCount ResourceName = "accessTokensCount"
)

type ResourceList map[ResourceName]resource.Quantity

type TenantSpec struct {
	// Customized name on dashboard
	TenantDisplayName string `json:"tenantDisplayName"`

	// Resource limit of this tenant
	ResourceQuota ResourceList `json:"resourceQuota"`

	// Owners, will generate tenant owner role bindings for them
	Owners []string `json:"owners"`
}

// TenantStatus defines the observed state of Tenant
type TenantStatus struct {
	UsedResourceQuota ResourceList `json:"usedResourceQuota"`
}

// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Age",type="date",JSONPath=".metadata.creationTimestamp"

// Tenant is the Schema for the deploykeys API
type Tenant struct {
	metaV1.TypeMeta   `json:",inline"`
	metaV1.ObjectMeta `json:"metadata,omitempty"`

	Spec   TenantSpec   `json:"spec,omitempty"`
	Status TenantStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true
type TenantList struct {
	metaV1.TypeMeta `json:",inline"`
	metaV1.ListMeta `json:"metadata,omitempty"`
	Items           []Tenant `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Tenant{}, &TenantList{})
}
