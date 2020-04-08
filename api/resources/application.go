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

type PodStatus struct {
	Name string `json:"name"`
	Node string `json:"node"`

	// Values are (Pending, Running, Succeeded, Failed)
	Status coreV1.PodPhase `json:"status"`

	// original phase value
	Phase coreV1.PodPhase `json:"phase"`

	// for frontend status column
	StatusText string `json:"statusText"`

	// Restarts
	Restarts int `json:"restarts"`

	// Is terminating
	IsTerminating bool `json:"isTerminating"`

	PodIPs            []string          `json:"podIps"`
	HostIP            string            `json:"hostIp"`
	CreationTimestamp int64             `json:"createTimestamp"`
	StartTimestamp    int64             `json:"startTimestamp"`
	Containers        []ContainerStatus `json:"containers"`
	Metrics           MetricHistories   `json:"metrics"`
	Warnings          []coreV1.Event    `json:"warnings"`
}

type ContainerStatus struct {
	Name         string `json:"name"`
	RestartCount int32  `json:"restartCount"`
	Ready        bool   `json:"ready"`
	Started      bool   `json:"started"`
	StartedAt    int64  `json:"startedAt"`
}

type ComponentStatus struct {
	Name         string                `json:"name"`
	WorkloadType v1alpha1.WorkLoadType `json:"workloadType"`

	DeploymentStatus appsV1.DeploymentStatus `json:"deploymentStatus,omitempty"`
	CronjobStatus    v1betav1.CronJobStatus  `json:"cronjobStatus,omitempty"`
	Pods             []PodStatus             `json:"pods"`

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

type MetricHistories struct {
	CPU    MetricHistory `json:"cpu"`
	Memory MetricHistory `json:"memory"`
}

type ApplicationDetails struct {
	Application     *Application      `json:"application"`
	ComponentStatus []ComponentStatus `json:"componentStatus"`
	PodNames        []string          `json:"podNames"`
	Metrics         MetricHistories   `json:"metrics"`
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

func (builder *Builder) BuildApplicationDetails(application *v1alpha1.Application) (*ApplicationDetails, error) {
	ns := application.Namespace
	listOptions := labelsBelongsToApplication(application.Name)

	resourceChannels := &ResourceChannels{
		PodList: builder.GetPodListChannel(ns, listOptions),
		EventList: builder.GetEventListChannel(ns, metaV1.ListOptions{
			LabelSelector: labels.Everything().String(),
			FieldSelector: fields.Everything().String(),
		}),
	}

	resources, err := resourceChannels.ToResources()

	if err != nil {
		builder.Logger.Error(err)
		return nil, err
	}

	componentsStatusList := builder.buildApplicationComponentStatus(application, resources)

	formatEnvs(application.Spec.SharedEnv)
	formatApplicationComponents(application.Spec.Components)

	podNames := []string{}

	for _, pod := range resources.PodList.Items {
		podNames = append(podNames, pod.Name)
	}

	var cpuHistoryList []MetricHistory
	var memHistoryList []MetricHistory
	for _, compStatus := range componentsStatusList {
		cpuHistoryList = append(cpuHistoryList, compStatus.CPU)
		memHistoryList = append(memHistoryList, compStatus.Memory)
	}
	appCpuHistory := aggregateHistoryList(cpuHistoryList)
	appMemHistory := aggregateHistoryList(memHistoryList)

	return &ApplicationDetails{
		Application: &Application{
			Name:       application.Name,
			Namespace:  application.Namespace,
			IsActive:   application.Spec.IsActive,
			SharedEnvs: application.Spec.SharedEnv,
			Components: application.Spec.Components,
		},
		PodNames:        podNames,
		ComponentStatus: componentsStatusList,
		Metrics: MetricHistories{
			CPU:    appCpuHistory,
			Memory: appMemHistory,
		},
	}, nil
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

func (builder *Builder) BuildApplicationListResponse(applications *v1alpha1.ApplicationList) ([]ApplicationDetails, error) {
	apps := []ApplicationDetails{}

	// TODO concurrent build response items
	for i := range applications.Items {
		item, err := builder.BuildApplicationDetails(&applications.Items[i])

		if err != nil {
			return nil, err
		}

		apps = append(apps, *item)
	}

	return apps, nil
}

func (builder *Builder) buildApplicationComponentStatus(application *v1alpha1.Application, resources *Resources) []ComponentStatus {
	res := []ComponentStatus{}

	componentKey2MetricMap := getComponentKey2MetricMap()

	for i := range application.Spec.Components {
		component := application.Spec.Components[i]

		workLoadType := component.WorkLoadType

		// TODO remote default value
		if workLoadType == "" {
			workLoadType = v1alpha1.WorkLoadTypeServer
		}

		componentStatus := ComponentStatus{
			Name:             component.Name,
			WorkloadType:     workLoadType,
			DeploymentStatus: appsV1.DeploymentStatus{},
			CronjobStatus:    v1betav1.CronJobStatus{},
			Pods:             []PodStatus{},
		}

		// TODO fix the default value, there should be a empty string
		if component.WorkLoadType == v1alpha1.WorkLoadTypeServer || component.WorkLoadType == "" {

			//deploymentName := fmt.Sprintf("%s-%s", application.Name, component.Name)
			//deployment := findDeploymentByName(resources.DeploymentList, deploymentName)

			//if deployment == nil {
			// this is not an error, for example if an application is not active, we can't find the deployment
			//builder.Logger.Infof("Can't find deployment with name %s", deploymentName)
			//} else {
			//componentStatus.DeploymentStatus = deployment.Status

			pods := findPods(resources.PodList, component.Name)
			//componentStatus.PodInfo = getPodsInfo(deployment.Status.Replicas, deployment.Spec.Replicas, pods)
			//componentStatus.PodInfo.Warnings = filterPodWarningEvents(resources.EventList.Items, pods)

			componentKey := fmt.Sprintf("%s-%s", application.Namespace, component.Name)
			componentMetrics := componentKey2MetricMap[componentKey]
			componentStatus.ComponentMetrics = componentMetrics

			componentStatus.Pods = getPods(pods, resources.EventList.Items, componentMetrics)
			//}
		}

		// TODO
		//if component.WorkLoadType == v1alpha1.WorkLoadTypeCronjob {
		//	componentStatus.CronjobStatus = v1betav1.CronJobStatus{}
		//}

		res = append(res, componentStatus)
	}

	return res
}

func getPods(pods []coreV1.Pod, events []coreV1.Event, componentMetrics ComponentMetrics) []PodStatus {
	res := []PodStatus{}

	for _, pod := range pods {
		ips := []string{}

		for _, x := range pod.Status.PodIPs {
			ips = append(ips, x.IP)
		}

		var startTimestamp int64

		if pod.Status.StartTime != nil {
			startTimestamp = pod.Status.StartTime.UnixNano() / int64(time.Millisecond)
		}

		statusText := string(pod.Status.Phase)
		restarts := 0
		initializing := false
		//readyContainers := 0

		for i := range pod.Status.InitContainerStatuses {
			container := pod.Status.InitContainerStatuses[i]
			restarts += int(container.RestartCount)
			switch {
			case container.State.Terminated != nil && container.State.Terminated.ExitCode == 0:
				continue
			case container.State.Terminated != nil:
				// initialization is failed
				if len(container.State.Terminated.Reason) == 0 {
					if container.State.Terminated.Signal != 0 {
						statusText = fmt.Sprintf("Init terminated: Signal:%d", container.State.Terminated.Signal)
					} else {
						statusText = fmt.Sprintf("Init terminated: ExitCode:%d", container.State.Terminated.ExitCode)
					}
				} else {
					statusText = "Init terminated: " + container.State.Terminated.Reason
				}
				initializing = true
			case container.State.Waiting != nil && len(container.State.Waiting.Reason) > 0 && container.State.Waiting.Reason != "PodInitializing":
				statusText = "Init waiting: " + container.State.Waiting.Reason
				initializing = true
			default:
				statusText = fmt.Sprintf("Init: %d/%d", i, len(pod.Spec.InitContainers))
				initializing = true
			}
			break
		}

		containers := []ContainerStatus{}

		if !initializing {
			restarts = 0
			for i := len(pod.Status.ContainerStatuses) - 1; i >= 0; i-- {
				container := pod.Status.ContainerStatuses[i]

				restarts += int(container.RestartCount)
				if container.State.Waiting != nil && container.State.Waiting.Reason != "" {
					statusText = fmt.Sprintf("Waiting: %s", container.State.Waiting.Reason)
				} else if container.State.Terminated != nil && container.State.Terminated.Reason != "" {
					statusText = fmt.Sprintf("Terminated: %s", container.State.Terminated.Reason)
				} else if container.State.Terminated != nil && container.State.Terminated.Reason == "" {
					if container.State.Terminated.Signal != 0 {
						statusText = fmt.Sprintf("Terminated: Signal:%d", container.State.Terminated.Signal)
					} else {
						statusText = fmt.Sprintf("Terminated: ExitCode:%d", container.State.Terminated.ExitCode)
					}
				} else if container.Ready && container.State.Running != nil {
					//readyContainers++
				}

				containers = append(containers, ContainerStatus{
					Name:         container.Name,
					RestartCount: container.RestartCount,
					Ready:        container.Ready,
					Started:      container.Started != nil && *container.Started == true,
				})
			}
		}

		warnings := []coreV1.Event{}

		if !IsReadyOrSucceeded(pod) {
			warnings = filterPodWarningEvents(events, []coreV1.Pod{pod})
		}

		res = append(res, PodStatus{
			Name:              pod.Name,
			Node:              pod.Spec.NodeName,
			Status:            getPodStatusPhase(pod, warnings),
			StatusText:        statusText,
			Restarts:          restarts,
			Phase:             pod.Status.Phase,
			PodIPs:            ips, // TODO, when to use host ip??
			HostIP:            pod.Status.HostIP,
			IsTerminating:     pod.DeletionTimestamp != nil,
			CreationTimestamp: pod.CreationTimestamp.UnixNano() / int64(time.Millisecond),
			StartTimestamp:    startTimestamp,
			Containers:        containers,
			Metrics:           componentMetrics.Pods[pod.Name],
			Warnings:          warnings,
		})
	}

	return res
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
