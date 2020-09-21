package resources

import (
	coreV1 "k8s.io/api/core/v1"
	"strings"
)

const (
	KALM_SYSTEM_NAMESPACE = "kalm-system"
	KALM_NAMESPACE_PREFIX = "kalm-"
)

type NamespaceListChannel struct {
	List  chan []Namespace
	Error chan error
}

type Namespace struct {
	Name  string   `json:"name"`
	Roles []string `json:"roles"`
}

func (resourceManager *ResourceManager) GetNamespaceListChannel() *NamespaceListChannel {
	channel := &NamespaceListChannel{
		List:  make(chan []Namespace, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var nsList coreV1.NamespaceList
		err := resourceManager.List(&nsList)

		if err != nil {
			channel.List <- nil
			channel.Error <- err
			return
		}

		list := make([]Namespace, 0, len(nsList.Items))

		for _, item := range nsList.Items {
			if !strings.HasPrefix(item.Name, KALM_NAMESPACE_PREFIX) {
				continue
			}

			if item.Name == KALM_SYSTEM_NAMESPACE {
				continue
			}

			// TODO is this correct to ignore deleting namespace?
			if item.DeletionTimestamp != nil {
				continue
			}
		}

		channel.List <- list
		channel.Error <- nil
	}()

	return channel
}

func (resourceManager *ResourceManager) ListNamespaces() ([]Namespace, error) {
	resourceChannels := &ResourceChannels{
		NamespaceList: resourceManager.GetNamespaceListChannel(),
	}

	resources, err := resourceChannels.ToResources()

	if err != nil {
		return nil, err
	}

	return resources.Namespaces, nil
}