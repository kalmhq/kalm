package resources

import (
	coreV1 "k8s.io/api/core/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type ServiceListChannel struct {
	List  chan []coreV1.Service
	Error chan error
}

type Service struct {
	Name               string `json:"name"`
	Namespace          string `json:"namespace"`
	coreV1.ServiceSpec `json:",inline"`
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

func (builder *Builder) GetServices(namespace string) ([]*Service, error) {
	var services coreV1.ServiceList

	if err := builder.List(&services, client.InNamespace(namespace)); err != nil {
		return nil, err
	}

	res := make([]*Service, len(services.Items))

	for i := range services.Items {
		res[i] = &Service{
			Name:        services.Items[i].Name,
			Namespace:   services.Items[i].Namespace,
			ServiceSpec: services.Items[i].Spec,
		}
	}

	return res, nil
}
