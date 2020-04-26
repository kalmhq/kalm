package resources

import (
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type ServiceListChannel struct {
	List  chan []coreV1.Service
	Error chan error
}

func (builder *Builder) GetServiceListChannel(namespaces string, listOptions metaV1.ListOptions) *ServiceListChannel {
	channel := &ServiceListChannel{
		List:  make(chan []coreV1.Service, 1),
		Error: make(chan error, 1),
	}

	go func() {
		list, err := builder.K8sClient.CoreV1().Services(namespaces).List(listOptions)

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
