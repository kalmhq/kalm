package resources

import (
	coreV1 "k8s.io/api/core/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type EventListChannel struct {
	List  chan *coreV1.EventList
	Error chan error
}

func (resourceManager *ResourceManager) GetEventListChannel(opts ...client.ListOption) *EventListChannel {
	channel := &EventListChannel{
		List:  make(chan *coreV1.EventList, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var list coreV1.EventList
		err := resourceManager.List(&list, opts...)

		channel.List <- &list
		channel.Error <- err
	}()

	return channel
}
