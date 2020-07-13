package resources

import (
	"encoding/json"
	"github.com/kalm-staging/kalm/controller/api/v1alpha1"
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"strings"
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
		err := builder.K8sClient.RESTClient().Get().AbsPath("/apis/core.kalm.dev/v1alpha1/" + namespaces + "/components").Do().Into(&fetched)
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
	*Component           `json:",inline"`
	Metrics              MetricHistories       `json:"metrics"`
	IstioMetricHistories *IstioMetricHistories `json:"istioMetricHistories"`
	Services             []ServiceStatus       `json:"services"`
	Pods                 []PodStatus           `json:"pods"`
}

func labelsBelongsToComponent(name string) metaV1.ListOptions {
	return matchLabel("kalm-component", name)
}

func (builder *Builder) BuildComponentDetails(component *v1alpha1.Component, resources *Resources) (details *ComponentDetails, err error) {
	if resources == nil {
		ns := component.Namespace
		nsListOption := client.InNamespace(ns)

		belongsToComponent := client.MatchingLabels{"kalm-component": component.Name}

		resourceChannels := &ResourceChannels{
			IstioMetricList:            builder.GetIstioMetricsListChannel(ns),
			PodList:                    builder.GetPodListChannel(nsListOption, belongsToComponent),
			EventList:                  builder.GetEventListChannel(nsListOption),
			ServiceList:                builder.GetServiceListChannel(nsListOption, belongsToComponent),
			ComponentPluginBindingList: builder.GetComponentPluginBindingListChannel(nsListOption, belongsToComponent),
		}

		resources, err = resourceChannels.ToResources()

		if err != nil {
			builder.Logger.Error(err)
			return nil, err
		}
	}

	pods := findPods(resources.PodList, component.Name)
	podsStatus := make([]PodStatus, 0, len(pods))

	for _, pod := range pods {
		podStatus := GetPodStatus(pod, resources.EventList.Items)
		podMetric := GetPodMetric(pod.Name, pod.Namespace)

		podStatus.Metrics = podMetric.MetricHistories
		podsStatus = append(podsStatus, *podStatus)
	}

	componentMetric := GetComponentMetric(component.Name, component.Namespace)

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

	istioMetricRst := &IstioMetricHistories{}

	for svcName, metric := range resources.IstioMetricHistories {
		ownerCompName, ownerNsName := getComponentAndNSNameFromSvcName(svcName)
		if (ownerCompName != component.Name && ownerCompName != component.Name+"-headless") ||
			ownerNsName != component.Namespace {
			continue
		}

		//todo need merge?
		istioMetricRst = metric
		break
	}

	details = &ComponentDetails{
		Component: &Component{
			Name:          component.Name,
			ComponentSpec: component.Spec,
			Plugins:       plugins,
		},
		Services: servicesStatus,
		Metrics: MetricHistories{
			CPU:    componentMetric.CPU,
			Memory: componentMetric.Memory,
		},
		IstioMetricHistories: istioMetricRst,
		Pods:                 podsStatus,
	}

	return details, nil
}

func getComponentAndNSNameFromSvcName(svcName string) (string, string) {
	parts := strings.Split(svcName, ".")
	if len(parts) < 2 {
		return "", ""
	}

	compName := parts[0]
	nsName := parts[1]

	return compName, nsName
}

func (builder *Builder) BuildComponentDetailsResponse(components *v1alpha1.ComponentList) ([]ComponentDetails, error) {

	if len(components.Items) == 0 {
		return nil, nil
	}

	var res []ComponentDetails

	ns := components.Items[0].Namespace
	nsListOption := client.InNamespace(ns)

	resourceChannels := &ResourceChannels{
		IstioMetricList:            builder.GetIstioMetricsListChannel(ns),
		PodList:                    builder.GetPodListChannel(nsListOption),
		EventList:                  builder.GetEventListChannel(nsListOption),
		ServiceList:                builder.GetServiceListChannel(nsListOption),
		ComponentPluginBindingList: builder.GetComponentPluginBindingListChannel(nsListOption),
	}

	resources, err := resourceChannels.ToResources()
	if err != nil {
		return nil, err
	}

	//fmt.Println("istio metricHistories:", resources.IstioMetricHistories)
	//for _, one := range resources.IstioMetricHistories {
	//	fmt.Printf("%+v", one.HTTPRequestsTotal)
	//}

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
		if list[i].Labels["kalm-component"] == componentName {
			res = append(res, list[i])
		}
	}

	return res
}

func findComponentPluginBindings(list []v1alpha1.ComponentPluginBinding, componentName string) []v1alpha1.ComponentPluginBinding {
	res := []v1alpha1.ComponentPluginBinding{}

	for i := range list {
		if list[i].Labels["kalm-component"] == componentName {
			res = append(res, list[i])
		}
	}

	return res
}
