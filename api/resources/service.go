package resources

import (
	coreV1 "k8s.io/api/core/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type ServiceListChannel struct {
	List  chan []coreV1.Service
	Error chan error
}

func (builder *Builder) GetServiceListChannel(opts ...client.ListOption) *ServiceListChannel {
	channel := &ServiceListChannel{
		List:  make(chan []coreV1.Service, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var list coreV1.ServiceList
		err := builder.List(&list, opts...)

		if err != nil {
			channel.List <- nil
			channel.Error <- err
			return
		}

		res := make([]coreV1.Service, len(list.Items))

		for i := range list.Items {
			res[i] = list.Items[i]
		}

		channel.List <- res
		channel.Error <- err
	}()

	return channel
}
