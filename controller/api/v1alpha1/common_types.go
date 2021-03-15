package v1alpha1

import (
	rbacV1 "k8s.io/api/rbac/v1"
	"k8s.io/apimachinery/pkg/api/resource"
)

const KalmSystemNamespace = "kalm-system"
const KalmControlPlaneLabelKey = "kalm-control-plane"

type EnvVarType string

const (
	EnvVarTypeStatic   EnvVarType = "static"
	EnvVarTypeExternal EnvVarType = "external"
	EnvVarTypeLinked   EnvVarType = "linked"
	EnvVarTypeFieldRef EnvVarType = "fieldref"
	EnvVarTypeBuiltin  EnvVarType = "builtin"

	EnvVarBuiltinHost      string = "host"
	EnvVarBuiltinPodName   string = "podName"
	EnvVarBuiltinNamespace string = "namespace"
)

// +kubebuilder:validation:Enum=http;https;http2;grpc;grpc-web;tcp;udp;unknown
type PortProtocol string

const (
	PortProtocolHTTP    PortProtocol = "http"
	PortProtocolHTTPS   PortProtocol = "https"
	PortProtocolHTTP2   PortProtocol = "http2"
	PortProtocolGRPC    PortProtocol = "grpc"
	PortProtocolGRPCWEB PortProtocol = "grpc-web"
	PortProtocolTCP     PortProtocol = "tcp"
	PortProtocolUDP     PortProtocol = "udp"
	PortProtocolUnknown PortProtocol = "unknown"
)

// EnvVar represents an environment variable present in a Container.
type EnvVar struct {
	// Name of the environment variable. Must be a C_IDENTIFIER.
	// +kubebuilder:validation:MinLength=1
	Name string `json:"name"`

	Value string `json:"value,omitempty"`

	// +kubebuilder:validation:Enum=static;external;linked;fieldref;builtin
	Type EnvVarType `json:"type,omitempty"`

	Prefix string `json:"prefix,omitempty"`

	Suffix string `json:"suffix,omitempty"`
}

type Port struct {
	// +kubebuilder:validation:Maximum=65535
	// +kubebuilder:validation:Minimum=1
	ContainerPort uint32 `json:"containerPort"`

	// port for service
	// +kubebuilder:validation:Maximum=65535
	// +kubebuilder:validation:Minimum=1
	ServicePort uint32 `json:"servicePort,omitempty"`

	// +kubebuilder:validation:Enum=http;https;http2;grpc;grpc-web;tcp;udp;unknown
	Protocol PortProtocol `json:"protocol"`
}

// +kubebuilder:validation:Enum=emptyDirMemory;emptyDir;pvc;pvcTemplate;hostpath
type VolumeType string

const (
	VolumeTypeTemporaryMemory       VolumeType = "emptyDirMemory"
	VolumeTypeTemporaryDisk         VolumeType = "emptyDir"
	VolumeTypePersistentVolumeClaim VolumeType = "pvc"

	VolumeTypePersistentVolumeClaimTemplate VolumeType = "pvcTemplate"

	VolumeTypeHostPath VolumeType = "hostpath"
)

type Volume struct {
	// the path we use to mount this volume to container
	Path string `json:"path"`

	// +optional
	HostPath string `json:"hostPath,omitempty"`

	// If we need to create this volume first, the size of the volume
	Size resource.Quantity `json:"size"`

	// Volume type
	Type VolumeType `json:"type,omitempty"`

	// Identify the StorageClass to create the pvc
	StorageClassName *string `json:"storageClassName,omitempty"`

	// instead of auto-provision new PV using StorageClass
	// we try to re-use existing PV
	PVToMatch string `json:"pvToMatch,omitempty"`

	// use to store pvc name, so the disk won't be recreate during restart
	// This field also can be used with existing pvc
	//
	// for Type: pvc, required, todo validate this in webhook?
	PVC string `json:"pvc,omitempty"`
}

type Config struct {
	Paths     []string `json:"paths"`
	MountPath string   `json:"mountPath"`
}

type DirectConfig struct {
	Content       string `json:"content"`
	MountFilePath string `json:"mountFilePath"`
}

type RunnerPermission struct {
	RoleType string              `json:"roleType"`
	Rules    []rbacV1.PolicyRule `json:"rules"`
}
