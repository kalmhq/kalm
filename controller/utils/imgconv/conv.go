package imgconv

// This package is mainly for converting images in various environments
// In most cases, no special treatment is required, but in some areas (such as China)
// there is no way to access some common image registry such as docker hub.

import (
	"fmt"
	"github.com/docker/distribution/reference"
)

const CloudAzureChina = "AzureChina"

func Convert(image string, couldName string) string {
	if couldName == "" {
		return image
	}

	ref, err := reference.ParseAnyReference(image)

	if err != nil {
		return image
	}

	switch couldName {
	case CloudAzureChina:
		switch v := ref.(type) {
		case reference.NamedTagged:
			return fmt.Sprintf("%s/%s:%s", convertAzureChinaImageHost(reference.Domain(v)), reference.Path(v), v.Tag())
		case reference.Named:
			return fmt.Sprintf("%s/%s", convertAzureChinaImageHost(reference.Domain(v)), reference.Path(v))
		}
	}

	return image
}

// https://github.com/Azure/container-service-for-azure-china/blob/master/aks/README.md#22-container-registry-proxy
func convertAzureChinaImageHost(oldHost string) string {
	switch oldHost {
	case "docker.io":
		return "dockerhub.azk8s.cn"
	case "gcr.io":
		return "gcr.azk8s.cn"
	case "k8s.gcr.io":
		return "gcr.azk8s.cn/google_containers"
	case "us.gcr.io":
		return "usgcr.azk8s.cn"
	case "quay.io":
		return "quay.azk8s.cn"
	case "mcr.microsoft.com":
		return "mcr.azk8s.cn"
	default:
		return oldHost
	}
}
