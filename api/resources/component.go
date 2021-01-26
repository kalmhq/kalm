package resources

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"go.uber.org/zap"
	"k8s.io/apimachinery/pkg/api/resource"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type ComponentListChannel struct {
	List  chan []v1alpha1.Component
	Error chan error
}

func (resourceManager *ResourceManager) GetComponent(namespace, name string) (*v1alpha1.Component, error) {
	component := &v1alpha1.Component{}
	err := resourceManager.Get(namespace, name, component)

	if err != nil {
		return nil, err
	}

	return component, nil
}

func (resourceManager *ResourceManager) GetComponentListChannel(namespaces string, listOptions metaV1.ListOptions) *ComponentListChannel {
	channel := &ComponentListChannel{
		List:  make(chan []v1alpha1.Component, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var fetched v1alpha1.ComponentList
		err := resourceManager.List(&fetched, client.InNamespace(namespaces))
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
	Name                            string                 `json:"name"`
	Namespace                       string                 `json:"namespace"`
	Plugins                         []runtime.RawExtension `json:"plugins,omitempty"`
	*v1alpha1.ComponentSpec         `json:",inline"`
	*v1alpha1.ProtectedEndpointSpec `json:"protectedEndpoint,omitempty"`
}

type CPUQuantity struct {
	resource.Quantity
}

func (c *CPUQuantity) MarshalJSON() ([]byte, error) {
	capInStr := strconv.FormatInt(c.MilliValue(), 10)
	return []byte(fmt.Sprintf(`"%sm"`, capInStr)), nil
}

type MemoryQuantity struct {
	resource.Quantity
}

func (m *MemoryQuantity) MarshalJSON() ([]byte, error) {
	capInStr := strconv.FormatInt(m.Value(), 10)
	return []byte(fmt.Sprintf(`"%s"`, capInStr)), nil
}

type ComponentDetails struct {
	Name string `json:"name"`

	v1alpha1.ComponentSpec          `json:",inline"`
	*v1alpha1.ProtectedEndpointSpec `json:"protectedEndpoint,omitempty"`

	// hack to override & ignore field in ComponentSpec
	//ResourceRequirements interface{} `json:"resourceRequirements,omitempty"`

	CPURequest    *CPUQuantity    `json:"cpuRequest,omitempty"`
	MemoryRequest *MemoryQuantity `json:"memoryRequest,omitempty"`
	CPULimit      *CPUQuantity    `json:"cpuLimit,omitempty"`
	MemoryLimit   *MemoryQuantity `json:"memoryLimit,omitempty"`

	Plugins []runtime.RawExtension `json:"plugins,omitempty"`

	Metrics              MetricHistories       `json:"metrics"`
	IstioMetricHistories *IstioMetricHistories `json:"istioMetricHistories"`
	Services             []ServiceStatus       `json:"services"`
	Pods                 []PodStatus           `json:"pods"`
	Jobs                 []JobStatus           `json:"jobs,omitempty"`
}

func (resourceManager *ResourceManager) BuildComponentDetails(
	component *v1alpha1.Component,
	resources *Resources,
) (details *ComponentDetails, err error) {
	if resources == nil {
		ns := component.Namespace
		nsListOption := client.InNamespace(ns)

		belongsToComponent := client.MatchingLabels{"kalm-component": component.Name}

		resourceChannels := &ResourceChannels{
			IstioMetricList:            resourceManager.GetIstioMetricsListChannel(ns),
			PodList:                    resourceManager.GetPodListChannel(nsListOption, belongsToComponent),
			EventList:                  resourceManager.GetEventListChannel(nsListOption),
			ServiceList:                resourceManager.GetServiceListChannel(nsListOption, belongsToComponent),
			ComponentPluginBindingList: resourceManager.GetComponentPluginBindingListChannel(nsListOption, belongsToComponent),
			ProtectedEndpointList:      resourceManager.GetProtectedEndpointsChannel(nsListOption),
			JobsList:                   resourceManager.GetJobListChannel(nsListOption),
		}

		resources, err = resourceChannels.ToResources()

		if err != nil {
			resourceManager.Logger.Error("channels to resources error", zap.Error(err))
			return nil, err
		}
	}

	pods := findPods(resources.PodList, component.Name)
	podsStatus := make([]PodStatus, 0, len(pods))

	for _, pod := range pods {
		podStatus := GetPodStatus(pod, resources.EventList.Items, component.Spec.WorkloadType)
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
		Name: component.Name,

		ComponentSpec: component.Spec,
		Plugins:       plugins,

		Services: servicesStatus,
		Metrics: MetricHistories{
			CPU:    componentMetric.CPU,
			Memory: componentMetric.Memory,
		},
		IstioMetricHistories: istioMetricRst,
		Pods:                 podsStatus,
	}

	if component.Spec.WorkloadType == v1alpha1.WorkloadTypeCronjob {
		jobs := findJobs(resources.JobList, component.Name)
		jobsStatus := make([]JobStatus, len(jobs))

		for i, job := range jobs {
			var startTimestamp int64
			var completionTimestamp int64

			if job.Status.StartTime != nil {
				startTimestamp = job.Status.StartTime.UnixNano() / int64(time.Millisecond)
			}

			if job.Status.CompletionTime != nil {
				completionTimestamp = job.Status.CompletionTime.UnixNano() / int64(time.Millisecond)
			}

			jobsStatus[i] = JobStatus{
				Name:                 job.Name,
				CreationTimestamp:    job.CreationTimestamp.UnixNano() / int64(time.Millisecond),
				CreationTimestampNew: job.CreationTimestamp.UnixNano() / int64(time.Millisecond),
				Parallelism:          job.Spec.Parallelism,
				Completions:          job.Spec.Completions,
				StartTimestamp:       startTimestamp,
				CompletionTimestamp:  completionTimestamp,
				Succeeded:            job.Status.Succeeded,
				Failed:               job.Status.Failed,
				Active:               job.Status.Active,
			}
		}

		details.Jobs = jobsStatus
	}

	for i := range resources.ProtectedEndpoints {
		protectedEndpoint := resources.ProtectedEndpoints[i]

		if protectedEndpoint.Spec.EndpointName == component.Name {
			details.ProtectedEndpointSpec = &protectedEndpoint.Spec
			break
		}
		continue
	}

	resRequirements := component.Spec.ResourceRequirements
	if resRequirements != nil && resRequirements.Requests != nil {
		if cpuReq, exist := resRequirements.Requests[coreV1.ResourceCPU]; exist {
			details.CPURequest = &CPUQuantity{cpuReq}
		}

		if memReq, exist := resRequirements.Requests[coreV1.ResourceMemory]; exist {
			details.MemoryRequest = &MemoryQuantity{memReq}
		}
	}

	if resRequirements != nil && resRequirements.Limits != nil {
		if cpuLimit, exist := resRequirements.Limits[coreV1.ResourceCPU]; exist {
			details.CPULimit = &CPUQuantity{cpuLimit}
		}

		if memLimit, exist := resRequirements.Limits[coreV1.ResourceMemory]; exist {
			details.MemoryLimit = &MemoryQuantity{memLimit}
		}
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

func (resourceManager *ResourceManager) BuildComponentDetailsResponse(
	components *v1alpha1.ComponentList,
) ([]ComponentDetails, error) {

	if len(components.Items) == 0 {
		return nil, nil
	}

	var res []ComponentDetails

	ns := components.Items[0].Namespace
	nsListOption := client.InNamespace(ns)

	resourceChannels := &ResourceChannels{
		IstioMetricList:            resourceManager.GetIstioMetricsListChannel(ns),
		PodList:                    resourceManager.GetPodListChannel(nsListOption),
		EventList:                  resourceManager.GetEventListChannel(nsListOption),
		ServiceList:                resourceManager.GetServiceListChannel(nsListOption),
		ComponentPluginBindingList: resourceManager.GetComponentPluginBindingListChannel(nsListOption),
		ProtectedEndpointList:      resourceManager.GetProtectedEndpointsChannel(nsListOption),
		JobsList:                   resourceManager.GetJobListChannel(nsListOption),
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
		item, err := resourceManager.BuildComponentDetails(&components.Items[i], resources)
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
