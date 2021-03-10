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
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type NameValue struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type DashboardConfig struct {
	Version  *string     `json:"version,omitempty"`
	Args     []string    `json:"args,omitempty"`
	Envs     []NameValue `json:"envs,omitempty"`
	Replicas *int32      `json:"replicas,omitempty"`
}

type ControllerConfig struct {
	Version *string `json:"version,omitempty"`
	// +optional
	UseLetsEncryptProductionAPI bool `json:"useLetsencryptProductionAPI"`
	// +optional
	ExternalDNSServerIP string `json:"externalDNSServerIP"`
}

// KalmOperatorConfigSpec defines the desired state of KalmOperatorConfig
type KalmOperatorConfigSpec struct {
	SkipIstioInstallation       bool `json:"skipIstioInstallation,omitempty"`
	SkipCertManagerInstallation bool `json:"skipCertManagerInstallation,omitempty"`
	// SkipKalmControllerInstallation bool `json:"skipKalmControllerInstallation,omitempty"`
	SkipKalmDashboardInstallation bool `json:"skipKalmDashboardInstallation,omitempty"`

	// deprecated, use Version instead
	KalmVersion string `json:"kalmVersion,omitempty"`
	Version     string `json:"version,omitempty"`

	// deprecated, diff mode has diff config now
	KalmType string `json:"kalmType,omitempty"`

	BYOCModeConfig *BYOCModeConfig `json:"byocModeConfig,omitempty"`

	LocalModeConfig *LocalModeConfig `json:"localModeConfig,omitempty"`

	PhysicalClusterID string `json:"physicalClusterId,omitempty"`

	// Dashboard Config
	Dashboard *DashboardConfig `json:"dashboard,omitempty"`
	// Controller Config
	Controller *ControllerConfig `json:"controller,omitempty"`
}

type BYOCModeConfig struct {
	ClusterUUID     string `json:"clusterUUID,omitempty"`
	KalmCloudDomain string `json:"kalmCloudDomain,omitempty"`
	Owner           string `json:"owner,omitempty"`

	// like: foobar.byoc.kalm.dev
	BaseDashboardDomain string `json:"baseDashboardDomain,omitempty"`
	// like: foobar.byoc-clusters.kalm-apps.com
	BaseAppDomain string `json:"baseAppDomain,omitempty"`
	// like: foobar.byoc-clusters.kalm-dns.com
	BaseDNSDomain string `json:"baseDNSDomain,omitempty"`

	ClusterName string `json:"clusterName,omitempty"`

	OIDCIssuer *OIDCIssuerConfig `json:"oidcIssuer,omitempty"`
}

type CloudModeConfig struct {
	// like: us-west1-1.kalm.dev
	BaseDashboardDomain string `json:"baseDashboardDomain,omitempty"`
	// like: us-west1-1.clusters.kalm-apps.com
	BaseAppDomain string `json:"baseAppDomain,omitempty"`
	// like: us-west1-1.clusters.kalm-dns.com
	BaseDNSDomain string `json:"baseDNSDomain,omitempty"`

	OIDCIssuer *OIDCIssuerConfig `json:"oidcIssuer,omitempty"`

	CloudflareConfig *CloudflareConfig `json:"cloudflareConfig,omitempty"`
}

type LocalModeConfig struct {
	CloudflareConfig *CloudflareConfig `json:"cloudflareConfig,omitempty"`
}

type OIDCIssuerConfig struct {
	// like: https://staging.kalm.dev/oidc
	IssuerURL    string `json:"issuerURL,omitempty"`
	ClientId     string `json:"clientId,omitempty"`
	ClientSecret string `json:"clientSecret,omitempty"`
}

type CloudflareConfig struct {
	APIToken             string            `json:"apiToken,omitempty"`
	DomainToZoneIDConfig map[string]string `json:"domainToZoneIDConfig,omitempty"`
}

type InstallStatusKey string

var (
	InstallStateStart                        InstallStatusKey = "INSTALLING"
	InstallStateInstalCertMgr                InstallStatusKey = "INSTALL_CERT_MANAGER"
	InstallStateInstalIstio                  InstallStatusKey = "INSTALL_ISTIO"
	InstallStateInstalKalmController         InstallStatusKey = "INSTALL_KALM_CONTROLLER"
	InstallStateInstalKalmDashboard          InstallStatusKey = "INSTALL_KALM_DASHBOARD"
	InstallStateInstalACMEServer             InstallStatusKey = "INSTALL_ACME_SERVER"
	InstallStateConfigureKalmDashboardAccess InstallStatusKey = "CONFIGURE_KALM_DASHBOARD_ACCESS"
	InstallStateConfigureACMEServerAccess    InstallStatusKey = "CONFIGURE_ACME_SERVER_ACCESS"
	InstallStateReportClusterInfo            InstallStatusKey = "REPORT_CLUSTER_INFO"
	InstallStateClusterFullySetup            InstallStatusKey = "CLUSTER_FULLY_SETUP"
	InstallStateDone                         InstallStatusKey = "INSTALLED"
)

var InstallStatesForBYOC = []InstallState{
	{InstallStateStart, 1 * time.Minute, ""},
	{InstallStateInstalCertMgr, 1 * time.Minute, "cert-manger installation takes longer than expected."},
	{InstallStateInstalIstio, 1 * time.Minute, "Istio installation takes longer than expected."},
	{InstallStateInstalKalmController, 1 * time.Minute, "kalm-controller installation takes longer than expected."},
	{InstallStateInstalKalmDashboard, 1 * time.Minute, "kalm-dashboard installation takes longer than expected."},
	{InstallStateInstalACMEServer, 1 * time.Minute, "acme-dns-server installation taker longer than expected."},
	{InstallStateConfigureKalmDashboardAccess, 2 * time.Minute, "External access for kalm-dashboard not ready, please check your cloud provider's load balancer service for details."},
	{InstallStateConfigureACMEServerAccess, 2 * time.Minute, "External access for acme-dns-server not ready, please check your cloud provider's load balancer service for details."},
	{InstallStateReportClusterInfo, 1 * time.Minute, "Report cluster info to kalm-cloud takes longer than expected."},
	{InstallStateClusterFullySetup, 1 * time.Minute, "Cluster fully setup takes longer than expected."},
	{InstallStateDone, 1 * time.Minute, ""},
}

var InstallStatesForLocal = []InstallState{
	{InstallStateStart, 1 * time.Minute, ""},
	{InstallStateInstalCertMgr, 1 * time.Minute, ""},
	{InstallStateInstalIstio, 1 * time.Minute, ""},
	{InstallStateInstalKalmController, 1 * time.Minute, ""},
	{InstallStateInstalKalmDashboard, 1 * time.Minute, ""},
	{InstallStateDone, 1 * time.Minute, ""},
}

type InstallState struct {
	Key         InstallStatusKey
	Timeout     time.Duration
	TimeoutHint string
}

type KalmOperatorConfigStatus struct {
	BYOCModeStatus    *BYOCModeStatus    `json:"byocModeStatus,omitempty"`
	InstallStatusKey  *InstallStatusKey  `json:"installStatus,omitempty"`
	InstallConditions []InstallCondition `json:"installCondition,omitempty"`
}

type InstallCondition struct {
	// Type of the condition.
	Type InstallStatusKey `json:"type"`

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

	// +optional
	LastTransitionTime *metav1.Time `json:"lastTransitionTime,omitempty" description:"last time the condition transit from one status to another"`
}

type BYOCModeStatus struct {
	clusterInfoHasSendToKalmCloud bool `json:"clusterInfoHasSendToKalmCloud,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status

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
