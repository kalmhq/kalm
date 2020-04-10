package resources

import (
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type ServiceListChannel struct {
	List  chan *coreV1.ServiceList
	Error chan error
}

func (builder *Builder) GetServiceListChannel(namespaces string, listOptions metaV1.ListOptions) *ServiceListChannel {
	channel := &ServiceListChannel{
		List:  make(chan *coreV1.ServiceList, 1),
		Error: make(chan error, 1),
	}

	go func() {
		list, err := builder.K8sClient.CoreV1().Services(namespaces).List(listOptions)
		channel.List <- list
		channel.Error <- err
	}()

	return channel
}
