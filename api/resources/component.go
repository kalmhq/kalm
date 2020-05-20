package resources

import (
	"encoding/json"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
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
	Plugins                []runtime.RawExtension `json:"plugins,omitempty"`
	Name                   string                 `json:"name"`
}

type ComponentDetails struct {
	*Component `json:",inline"`
	Metrics    MetricHistories `json:"metrics"`
	Services   []ServiceStatus `json:"services"`
	Pods       []PodStatus     `json:"pods"`
}

func labelsBelongsToComponent(name string) metaV1.ListOptions {
	return matchLabel("kapp-component", name)
}

func (builder *Builder) BuildComponentDetails(component *v1alpha1.Component, resources *Resources) (details *ComponentDetails, err error) {
	if resources == nil {
		ns := client.InNamespace(component.Namespace)
		belongsToComponent := client.MatchingLabels{"kapp-component": component.Name}

		resourceChannels := &ResourceChannels{
			PodList: builder.GetPodListChannel(
				ns, belongsToComponent,
			),
			EventList:                  builder.GetEventListChannel(ns),
			ServiceList:                builder.GetServiceListChannel(ns, belongsToComponent),
			ComponentPluginBindingList: builder.GetComponentPluginBindingListChannel(ns, belongsToComponent),
		}

		resources, err = resourceChannels.ToResources()

		if err != nil {
			builder.Logger.Error(err)
			return nil, err
		}
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

	componentPluginBindings := findComponentPluginBindings(resources.ComponentPluginBindings, component.Name)
	plugins := make([]runtime.RawExtension, 0, len(componentPluginBindings))

	for _, binding := range componentPluginBindings {
		if binding.DeletionTimestamp != nil {
			continue
		}

		var plugin ComponentPluginBinding

		plugin.Name = binding.Spec.PluginName
		plugin.Config = binding.Spec.Config
		plugin.IsActive = !binding.Spec.IsDisabled

		bts, _ := json.Marshal(plugin)

		plugins = append(plugins, runtime.RawExtension{
			Raw: bts,
		})
	}

	services := findComponentServices(resources.Services, component.Name)
	servicesStatus := make([]ServiceStatus, len(services))
	for i, service := range services {
		servicesStatus[i] = ServiceStatus{
			Name:      service.Name,
			ClusterIP: service.Spec.ClusterIP,
			Ports:     service.Spec.Ports,
		}
	}

	details = &ComponentDetails{
		Component: &Component{
			Name:          component.Name,
			ComponentSpec: component.Spec,
			Plugins:       plugins,
		},
		Services: servicesStatus,
		Metrics: MetricHistories{
			CPU:    appCpuHistory,
			Memory: appMemHistory,
		},
		Pods: podsStatus,
	}

	return details, nil
}

func (builder *Builder) BuildComponentDetailsResponse(components *v1alpha1.ComponentList) ([]ComponentDetails, error) {

	if len(components.Items) == 0 {
		return nil, nil
	}

	res := []ComponentDetails{}
	ns := client.InNamespace(components.Items[0].Namespace)

	resourceChannels := &ResourceChannels{
		PodList:                    builder.GetPodListChannel(ns),
		EventList:                  builder.GetEventListChannel(ns),
		ServiceList:                builder.GetServiceListChannel(ns),
		ComponentPluginBindingList: builder.GetComponentPluginBindingListChannel(ns),
	}

	resources, err := resourceChannels.ToResources()

	if err != nil {
		return nil, err
	}

	for i := range components.Items {
		item, err := builder.BuildComponentDetails(&components.Items[i], resources)
		if err != nil {
			return nil, err
		}
		res = append(res, *item)
	}

	return res, nil
}

func findComponentServices(list []coreV1.Service, componentName string) []coreV1.Service {
	res := []coreV1.Service{}

	for i := range list {
		if list[i].Labels["kapp-component"] == componentName {
			res = append(res, list[i])
		}
	}

	return res
}

func findComponentPluginBindings(list []v1alpha1.ComponentPluginBinding, componentName string) []v1alpha1.ComponentPluginBinding {
	res := []v1alpha1.ComponentPluginBinding{}

	for i := range list {
		if list[i].Labels["kapp-component"] == componentName {
			res = append(res, list[i])
		}
	}

	return res
}
