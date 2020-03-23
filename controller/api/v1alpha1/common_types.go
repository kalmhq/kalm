package v1alpha1

import (
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
)

type EnvVarType string

const (
	EnvVarTypeStatic   EnvVarType = "static"
	EnvVarTypeExternal EnvVarType = "external"
	EnvVarTypeLinked   EnvVarType = "linked"
)

// EnvVar represents an environment variable present in a Container.
type EnvVar struct {
	// Name of the environment variable. Must be a C_IDENTIFIER.
	Name string `json:"name"`

	Value string `json:"value,omitempty"`

	// +kubebuilder:validation:Enum=static;external;linked
	Type EnvVarType `json:"type,omitempty"`

	Prefix string `json:"prefix,omitempty"`

	Suffix string `json:"suffix,omitempty"`
}

type Port struct {
	Name string `json:"name"`

	// +kubebuilder:validation:Maximum:65535
	ContainerPort uint32 `json:"containerPort"`

	// ? what is service port for?
	// +kubebuilder:validation:Maximum:65535
	ServicePort uint32 `json:"servicePort,omitempty"`

	// +kubebuilder:validation:Enum=TCP;UDP;SCTP
	Protocol corev1.Protocol `json:"protocol,omitempty"`
}

type VolumeType string

const (
	VolumeTypeTemporaryMemory       VolumeType = "emptyDirMemory"
	VolumeTypeTemporaryDisk         VolumeType = "emptyDir"
	VolumeTypeKappConfigs           VolumeType = "kapp-configs"
	VolumeTypePersistentVolumeClaim VolumeType = "pvc"

	// TODO
	// HostPath
)

type Volume struct {
	// the path we use to mount this volume to container
	Path string `json:"path"`

	// If we need to create this volume first, the size of the volume
	Size resource.Quantity `json:"size"`

	// Volume type
	Type VolumeType `json:"type,omitempty"`

	// the config path of kapp config, can be a file or a directory
	KappConfigPath string `json:"kappConfigPath,omitempty"`

	// Identify the StorageClass to create the pvc
	StorageClassName *string `json:"storageClassName,omitempty"`

	// use to store pvc name, so the disk won't be recreate during restart
	// This field also can be used with existing pvc
	PersistentVolumeClaimName string `json:"persistentVolumeClaimName,omitempty"`
}
