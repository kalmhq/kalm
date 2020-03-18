package resources

import (
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type EventListChannel struct {
	List  chan *coreV1.EventList
	Error chan error
}

func (builder *ResponseBuilder) GetEventListChannel(namespaces string, listOptions metaV1.ListOptions) *EventListChannel {
	channel := &EventListChannel{
		List:  make(chan *coreV1.EventList, 1),
		Error: make(chan error, 1),
	}

	go func() {
		list, err := builder.K8sClient.CoreV1().Events(namespaces).List(listOptions)
		channel.List <- list
		channel.Error <- err
	}()

	return channel
}
