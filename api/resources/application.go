package resources

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	appsV1 "k8s.io/api/apps/v1"
	v1betav1 "k8s.io/api/batch/v1beta1"
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/fields"
	"k8s.io/apimachinery/pkg/labels"
)

type ListMeta struct {
	TotalCount        int `json:"totalCount"`
	PerPage           int `json:"perPage"`
	CurrentPageNumber int `json:"page"`
}

type PodInfo struct {
	// Number of pods that are created.
	Current int32 `json:"current"`

	// Number of pods that are desired.
	Desired *int32 `json:"desired,omitempty"`

	// Number of pods that are currently running.
	Running int32 `json:"running"`

	// Number of pods that are currently waiting.
	Pending int32 `json:"pending"`

	// Number of pods that are failed.
	Failed int32 `json:"failed"`

	// Number of pods that are succeeded.
	Succeeded int32 `json:"succeeded"`

	// Unique warning messages related to pods in this resource.
	Warnings []coreV1.Event `json:"warnings"`
}

type ComponentStatus struct {
	Name         string                `json:"name"`
	WorkloadType v1alpha1.WorkLoadType `json:"workloadType"`

	DeploymentStatus appsV1.DeploymentStatus `json:"deploymentStatus,omitempty"`
	CronjobStatus    v1betav1.CronJobStatus  `json:"cronjobStatus,omitempty"`
	PodInfo          *PodInfo                `json:"podsInfo"`

	//MetricsList metricv1beta1.PodMetricsList `json:"podMetricsList"`
	// TODO, aggregate cpu, memory usage time series
	ComponentMetrics `json:"metrics"`
}

type ComponentMetrics struct {
	Name            string `json:"-"`
	MetricHistories `json:",inline,omitempty"`
	Pods            map[string]MetricHistories `json:"pods"`
}

// https://github.com/kubernetes/dashboard/blob/master/src/app/backend/integration/metric/api/types.go#L121
type MetricPoint struct {
	Timestamp time.Time
	Value     uint64
}

func (m *MetricPoint) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]interface{}{
		"x": m.Timestamp.Unix() * 1000,
		"y": m.Value,
	})
}

type ApplicationListResponseItem struct {
	Name       string             `json:"name"`
	Namespace  string             `json:"namespace"`
	CreatedAt  time.Time          `json:"createdAt"`
	IsActive   bool               `json:"isActive"`
	Components []*ComponentStatus `json:"components"`
	Metrics    MetricHistories    `json:"metrics"`
}

type MetricHistories struct {
	CPU    MetricHistory `json:"cpu"`
	Memory MetricHistory `json:"memory"`
}

type ApplicationListResponse struct {
	//ListMeta     *ListMeta                      `json:"listMeta"`
	Applications []*ApplicationListResponseItem `json:"applications"`
}

type ApplicationResponse struct {
	Application *Application `json:"application"`
	PodNames    []string     `json:"podNames"`
}

type CreateOrUpdateApplicationRequest struct {
	Application *Application `json:"application"`
}

type Application struct {
	Name       string                   `json:"name"`
	Namespace  string                   `json:"namespace"`
	IsActive   bool                     `json:"isActive"`
	SharedEnvs []v1alpha1.EnvVar        `json:"sharedEnvs"`
	Components []v1alpha1.ComponentSpec `json:"components"`
}

func (builder *Builder) BuildApplicationDetailsResponse(application *v1alpha1.Application) *ApplicationResponse {
	ns := application.Namespace
	listOptions := labelsBelongsToApplication(application.Name)

	resourceChannels := &ResourceChannels{
		//DeploymentList: builder.GetDeploymentListChannel(ns, listOptions),
		PodList: builder.GetPodListChannel(ns, listOptions),
		//ReplicaSetList: builder.GetReplicaSetListChannel(ns, listOptions),
		//EventList: builder.GetEventListChannel(ns, metaV1.ListOptions{
		//	LabelSelector: labels.Everything().String(),
		//	FieldSelector: fields.Everything().String(),
		//}),
	}

	resources, err := resourceChannels.ToResources()

	if err != nil {
		builder.Logger.Error(err)
	}

	formatEnvs(application.Spec.SharedEnv)
	formatApplicationComponents(application.Spec.Components)

	podNames := []string{}

	for _, pod := range resources.PodList.Items {
		podNames = append(podNames, pod.Name)
	}

	return &ApplicationResponse{
		Application: &Application{
			Name:       application.Name,
			Namespace:  application.Namespace,
			IsActive:   application.Spec.IsActive,
			SharedEnvs: application.Spec.SharedEnv,
			Components: application.Spec.Components,
		},
		PodNames: podNames,
	}
}

// TODO formatters should be deleted in the feature, Use validator instead
func formatEnvs(envs []v1alpha1.EnvVar) {
	for i := range envs {
		if envs[i].Type == "" {
			envs[i].Type = v1alpha1.EnvVarTypeStatic
		}
	}
}

func formatApplicationComponents(components []v1alpha1.ComponentSpec) {
	for i := range components {
		formatEnvs(components[i].Env)

		if components[i].DnsPolicy == "" {
			components[i].DnsPolicy = coreV1.DNSClusterFirst
		}

		if components[i].RestartPolicy == "" {
			components[i].RestartPolicy = coreV1.RestartPolicyAlways
		}

		if components[i].TerminationGracePeriodSeconds == nil {
			x := int64(30)
			components[i].TerminationGracePeriodSeconds = &x
		}

		if components[i].RestartStrategy == "" {
			components[i].RestartStrategy = appsV1.RollingUpdateDeploymentStrategyType
		}

		if components[i].WorkLoadType == "" {
			components[i].WorkLoadType = v1alpha1.WorkLoadTypeServer
		}
	}
}

func (builder *Builder) BuildApplicationListResponse(applications *v1alpha1.ApplicationList) *ApplicationListResponse {

	apps := []*ApplicationListResponseItem{}

	// TODO concurrent build response items
	for i := range applications.Items {
		apps = append(apps, builder.buildApplicationListResponseItem(&applications.Items[i]))
	}

	return &ApplicationListResponse{
		//ListMeta:     &ListMeta{}, // TODO
		Applications: apps,
	}
}

func (builder *Builder) buildApplicationListResponseItem(application *v1alpha1.Application) *ApplicationListResponseItem {
	ns := application.Namespace
	listOptions := labelsBelongsToApplication(application.Name)

	resourceChannels := &ResourceChannels{
		DeploymentList: builder.GetDeploymentListChannel(ns, listOptions),
		PodList:        builder.GetPodListChannel(ns, listOptions),
		ReplicaSetList: builder.GetReplicaSetListChannel(ns, listOptions),
		EventList: builder.GetEventListChannel(ns, metaV1.ListOptions{
			LabelSelector: labels.Everything().String(),
			FieldSelector: fields.Everything().String(),
		}),
		//PodMetricsList: builder.GetPodMetricsListChannel(ns, listOptions),
	}

	resources, err := resourceChannels.ToResources()

	if err != nil {
		builder.Logger.Error(err)
	}

	componentStatus := builder.buildApplicationComponentStatus(application, resources)

	var cpuHistoryList []MetricHistory
	var memHistoryList []MetricHistory
	for _, status := range componentStatus {
		cpuHistoryList = append(cpuHistoryList, status.CPU)
		memHistoryList = append(memHistoryList, status.Memory)
	}
	appCpuHistory := aggregateHistoryList(cpuHistoryList)
	appMemHistory := aggregateHistoryList(memHistoryList)

	return &ApplicationListResponseItem{
		Name:       application.ObjectMeta.Name,
		Namespace:  application.ObjectMeta.Namespace,
		IsActive:   application.Spec.IsActive,
		CreatedAt:  application.ObjectMeta.CreationTimestamp.Time,
		Components: componentStatus,
		Metrics: MetricHistories{
			CPU:    appCpuHistory,
			Memory: appMemHistory,
		},
	}
}

func (builder *Builder) buildApplicationComponentStatus(application *v1alpha1.Application, resources *Resources) []*ComponentStatus {
	res := []*ComponentStatus{}

	sumMap := getComponentMetricSumList()

	for i := range application.Spec.Components {
		component := application.Spec.Components[i]

		componentStatus := &ComponentStatus{
			Name:             component.Name,
			WorkloadType:     component.WorkLoadType,
			DeploymentStatus: appsV1.DeploymentStatus{},
			CronjobStatus:    v1betav1.CronJobStatus{},
			PodInfo:          &PodInfo{},

			//ComponentMetrics: ComponentMetrics{}, // TODO
		}

		// TODO fix the default value, there should be a empty string
		if component.WorkLoadType == v1alpha1.WorkLoadTypeServer || component.WorkLoadType == "" {

			deploymentName := fmt.Sprintf("%s-%s", application.Name, component.Name)
			deployment := findDeploymentByName(resources.DeploymentList, deploymentName)

			if deployment == nil {
				// this is not an error, for example if an application is not active, we can't find the deployment
				builder.Logger.Infof("Can't find deployment with name %s", deploymentName)
			} else {
				componentStatus.DeploymentStatus = deployment.Status

				pods := findPods(resources.PodList, component.Name)
				componentStatus.PodInfo = getPodsInfo(deployment.Status.Replicas, deployment.Spec.Replicas, pods)
				componentStatus.PodInfo.Warnings = filterPodWarningEvents(resources.EventList.Items, pods)

				//podMetricsList := getPodMetricsListForComponent(deploymentName, resources.PodMetricsList)
				//componentStatus.MetricsList = podMetricsList

				//metricsSum := getMetricsSum(podMetricsList)
				//componentStatus.MetricsSum = metricsSum
				componentKey := fmt.Sprintf("%s-%s", application.Namespace, component.Name)
				if v, exist := sumMap[componentKey]; exist {
					componentStatus.ComponentMetrics = v
				}
			}
		}

		// TODO
		//if component.WorkLoadType == v1alpha1.WorkLoadTypeCronjob {
		//	componentStatus.CronjobStatus = v1betav1.CronJobStatus{}
		//}

		// todo fill metric info

		res = append(res, componentStatus)
	}

	return res
}

//func getPodMetricsListForComponent(componentDpName string, list *metricv1beta1.PodMetricsList) metricv1beta1.PodMetricsList {
//	metricsList := metricv1beta1.PodMetricsList{
//		TypeMeta: list.TypeMeta,
//		ListMeta: list.ListMeta,
//	}
//
//	for _, podMetrics := range list.Items {
//		if !strings.HasPrefix(podMetrics.Name, componentDpName) {
//			continue
//		}
//
//		metricsList.Items = append(metricsList.Items, podMetrics)
//	}
//
//	return metricsList
//}

//func getMetricsSum(podMetricsList metricv1beta1.PodMetricsList) (resp MetricsSum) {
//	for _, m := range podMetricsList.Items {
//		for _, c := range m.Containers {
//			cpu := c.Usage.Cpu()
//			mem := c.Usage.Memory()
//
//			resp.CPUUsage += cpu.Value()
//			resp.MemoryUsage += mem.Value()
//		}
//	}
//
//	return
//}

func getPodsInfo(current int32, desired *int32, pods []coreV1.Pod) *PodInfo {
	result := &PodInfo{
		Current:  current,
		Desired:  desired,
		Warnings: make([]coreV1.Event, 0),
	}

	for _, pod := range pods {
		switch pod.Status.Phase {
		case coreV1.PodRunning:
			result.Running++
		case coreV1.PodPending:
			result.Pending++
		case coreV1.PodFailed:
			result.Failed++
		case coreV1.PodSucceeded:
			result.Succeeded++
		}
	}

	return result

}

func findDeploymentByName(list *appsV1.DeploymentList, name string) *appsV1.Deployment {
	for i := range list.Items {
		if list.Items[i].Name == name {
			return &list.Items[i]
		}
	}

	return nil
}

func findPods(list *coreV1.PodList, componentName string) []coreV1.Pod {
	res := []coreV1.Pod{}

	for i := range list.Items {
		if list.Items[i].Labels["kapp-component"] == componentName {
			res = append(res, list.Items[i])
		}
	}

	return res
}
