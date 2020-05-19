package resources

import (
	"encoding/json"
	"fmt"
	authorizationV1 "k8s.io/api/authorization/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"time"

	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	appsV1 "k8s.io/api/apps/v1"
	coreV1 "k8s.io/api/core/v1"
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

type ServiceStatus struct {
	Name      string               `json:"name"`
	ClusterIP string               `json:"clusterIP"`
	Ports     []coreV1.ServicePort `json:"ports"`
}

type ComponentMetrics struct {
	Name            string `json:"-"`
	MetricHistories `json:",inline,omitempty"`
	Pods            map[string]MetricHistories `json:"pods"`
}

type PodMetrics struct {
	Name            string `json:"-"`
	MetricHistories `json:",inline,omitempty"`
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
	*Application `json:",inline"`
	Metrics      MetricHistories `json:"metrics"`
	Roles        []string        `json:"roles"`
}

type CreateOrUpdateApplicationRequest struct {
	Application *Application `json:"application"`
}

type Application struct {
	Name       string                 `json:"name"`
	Namespace  string                 `json:"namespace"`
	IsActive   bool                   `json:"isActive"`
	SharedEnvs []v1alpha1.EnvVar      `json:"sharedEnvs,omitempty"`
	Plugins    []runtime.RawExtension `json:"plugins"`
}

func (builder *Builder) BuildApplicationDetails(application *v1alpha1.Application) (*ApplicationDetails, error) {
	ns := application.Name
	listOptions := labelsBelongsToApplication(application.Name)

	resourceChannels := &ResourceChannels{
		PodList:                      builder.GetPodListChannel(ns, listOptions),
		ApplicationPluginBindingList: builder.GetApplicationPluginBindingListChannel(ns, ListAll),
	}

	resources, err := resourceChannels.ToResources()

	if err != nil {
		builder.Logger.Error(err)
		return nil, err
	}

	roles := make([]string, 0, 2)

	// TODO Is there a better way?
	// Infer user roles with some specific access review. This is not accurate but a trade off.
	writerReview, err := builder.K8sClient.AuthorizationV1().SelfSubjectAccessReviews().Create(&authorizationV1.SelfSubjectAccessReview{
		Spec: authorizationV1.SelfSubjectAccessReviewSpec{
			ResourceAttributes: &authorizationV1.ResourceAttributes{
				Namespace: application.Name,
				Resource:  "applications",
				Verb:      "create",
				Group:     "core.kapp.dev",
			},
		},
	})

	if err != nil {
		return nil, err
	}

	if writerReview.Status.Allowed {
		roles = append(roles, "writer")
	}

	readerReview, err := builder.K8sClient.AuthorizationV1().SelfSubjectAccessReviews().Create(&authorizationV1.SelfSubjectAccessReview{
		Spec: authorizationV1.SelfSubjectAccessReviewSpec{
			ResourceAttributes: &authorizationV1.ResourceAttributes{
				Namespace: application.Name,
				Resource:  "applications",
				Verb:      "get",
				Group:     "core.kapp.dev",
			},
		},
	})

	if err != nil {
		return nil, err
	}

	if readerReview.Status.Allowed {
		roles = append(roles, "reader")
	}

	formatEnvs(application.Spec.SharedEnv)

	podNames := []string{}
	var cpuHistoryList []MetricHistory
	var memHistoryList []MetricHistory

	for _, pod := range resources.PodList.Items {
		podNames = append(podNames, pod.Name)

		podMetric := getPodMetrics(pod.Name)
		cpuHistoryList = append(cpuHistoryList, podMetric.CPU)
		memHistoryList = append(memHistoryList, podMetric.Memory)
	}

	appCpuHistory := aggregateHistoryList(cpuHistoryList)
	appMemHistory := aggregateHistoryList(memHistoryList)

	plugins := make([]runtime.RawExtension, 0, len(resources.ApplicationPluginBindings))

	for _, binding := range resources.ApplicationPluginBindings {
		if binding.DeletionTimestamp != nil {
			continue
		}
		var plugin ApplicationPluginBinding

		plugin.Name = binding.Spec.PluginName
		plugin.Config = binding.Spec.Config
		plugin.IsActive = !binding.Spec.IsDisabled

		bts, _ := json.Marshal(plugin)

		plugins = append(plugins, runtime.RawExtension{
			Raw: bts,
		})
	}

	return &ApplicationDetails{
		Application: &Application{
			Name:       application.Name,
			Namespace:  application.Namespace,
			IsActive:   application.Spec.IsActive,
			SharedEnvs: application.Spec.SharedEnv,
			Plugins:    plugins,
		},
		Metrics: MetricHistories{
			CPU:    appCpuHistory,
			Memory: appMemHistory,
		},
		Roles: roles,
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

func formatApplicationComponents(components []Component) {
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

		if components[i].WorkloadType == "" {
			components[i].WorkloadType = v1alpha1.WorkloadTypeServer
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

func getPodStatus(pod coreV1.Pod, events []coreV1.Event) *PodStatus {
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

	return &PodStatus{
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
		Warnings:          warnings,
	}
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
