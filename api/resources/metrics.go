package resources

import (
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	v1beta1 "k8s.io/metrics/pkg/apis/metrics/v1beta1"
	metricsv1beta1 "k8s.io/metrics/pkg/client/clientset/versioned/typed/metrics/v1beta1"
)

type PodMetricsListChannel struct {
	List  chan *v1beta1.PodMetricsList
	Error chan error
}

func (builder *Builder) GetPodMetricsListChannel(namespaces string, listOptions metaV1.ListOptions) *PodMetricsListChannel {
	channel := &PodMetricsListChannel{
		List:  make(chan *v1beta1.PodMetricsList, 1),
		Error: make(chan error, 1),
	}

	client, err := metricsv1beta1.NewForConfig(builder.Config)
	if err != nil {
		channel.List <- nil
		channel.Error <- err

		return channel
	}

	go func() {
		list, err := client.PodMetricses(namespaces).List(listOptions)

		channel.List <- list
		channel.Error <- err
	}()

	return channel
}
