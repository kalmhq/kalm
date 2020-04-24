package resources

import (
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/fields"
	"k8s.io/apimachinery/pkg/labels"
)

type ComponentListChannel struct {
	List  chan []v1alpha1.Component
	Error chan error
}

func (builder *Builder) GetComponentListChannel(namespaces string, listOptions metaV1.ListOptions) *ComponentListChannel {
	channel := &ComponentListChannel{
		List:  make(chan []v1alpha1.Component, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var fetched v1alpha1.ComponentList
		err := builder.K8sClient.RESTClient().Get().AbsPath("/apis/core.kapp.dev/v1alpha1/" + namespaces + "/components").Do().Into(&fetched)
		res := make([]v1alpha1.Component, len(fetched.Items))

		for i, item := range fetched.Items {
			res[i] = item
		}

		channel.List <- res
		channel.Error <- err
	}()

	return channel
}

type Component struct {
	v1alpha1.ComponentSpec `json:",inline"`
	Name                   string `json:"name"`
}

type ComponentDetails struct {
	*Component `json:",inline"`
	Metrics    MetricHistories `json:"metrics"`
	Pods       []PodStatus     `json:"pods"`
}

func labelsBelongsToComponent(name string) metaV1.ListOptions {
	return matchLabel("kapp-component", name)
}

func (builder *Builder) BuildComponentDetails(component *v1alpha1.Component) (*ComponentDetails, error) {
	ns := component.Namespace
	listOptions := labelsBelongsToComponent(component.Name)

	resourceChannels := &ResourceChannels{
		PodList: builder.GetPodListChannel(ns, listOptions),
		EventList: builder.GetEventListChannel(ns, metaV1.ListOptions{
			LabelSelector: labels.Everything().String(),
			FieldSelector: fields.Everything().String(),
		}),
		ServiceList: builder.GetServiceListChannel(ns, listOptions),
	}

	resources, err := resourceChannels.ToResources()

	if err != nil {
		builder.Logger.Error(err)
		return nil, err
	}
	pods := findPods(resources.PodList, component.Name)
	podsStatus := make([]PodStatus, 0, len(pods))

	var cpuHistoryList []MetricHistory
	var memHistoryList []MetricHistory

	for _, pod := range pods {
		podStatus := getPodStatus(pod, resources.EventList.Items)
		podMetric := getPodMetrics(pod.Name)

		podStatus.Metrics = podMetric.MetricHistories
		cpuHistoryList = append(cpuHistoryList, podMetric.CPU)
		memHistoryList = append(memHistoryList, podMetric.Memory)

		podsStatus = append(podsStatus, *podStatus)
	}

	appCpuHistory := aggregateHistoryList(cpuHistoryList)
	appMemHistory := aggregateHistoryList(memHistoryList)

	return &ComponentDetails{
		Component: &Component{
			Name:          component.Name,
			ComponentSpec: component.Spec,
		},
		Metrics: MetricHistories{
			CPU:    appCpuHistory,
			Memory: appMemHistory,
		},
		Pods: podsStatus,
	}, nil
}

func (builder *Builder) BuildComponentDetailsResponse(components *v1alpha1.ComponentList) ([]ComponentDetails, error) {
	apps := []ComponentDetails{}

	// TODO concurrent build response items
	for i := range components.Items {
		item, err := builder.BuildComponentDetails(&components.Items[i])

		if err != nil {
			return nil, err
		}

		apps = append(apps, *item)
	}

	return apps, nil
}
