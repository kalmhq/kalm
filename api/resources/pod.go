package resources

import (
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type PodListChannel struct {
	List  chan *coreV1.PodList
	Error chan error
}

func (builder *Builder) GetPodListChannel(namespaces string, listOptions metaV1.ListOptions) *PodListChannel {
	channel := &PodListChannel{
		List:  make(chan *coreV1.PodList, 1),
		Error: make(chan error, 1),
	}

	go func() {
		list, err := builder.K8sClient.CoreV1().Pods(namespaces).List(listOptions)
		channel.List <- list
		channel.Error <- err
	}()

	return channel
}
