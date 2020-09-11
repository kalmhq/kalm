package resources

import (
	"fmt"
	"time"

	"github.com/kalmhq/kalm/controller/controllers"
	authorizationV1 "k8s.io/api/authorization/v1"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
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

type ApplicationDetails struct {
	*Application         `json:",inline"`
	Metrics              MetricHistories       `json:"metrics"`
	IstioMetricHistories *IstioMetricHistories `json:"istioMetricHistories"`
	Roles                []string              `json:"roles"`
	Status               string                `json:"status"` // Active or Terminating
}

type CreateOrUpdateApplicationRequest struct {
	Application *Application `json:"application"`
}

type Application struct {
	Name string `json:"name"`
}

func (resourceManager *ResourceManager) GetNamespace(name string) (*coreV1.Namespace, error) {
	namespace := new(coreV1.Namespace)

	err := resourceManager.Get("", name, namespace)

	if err != nil {
		return nil, err
	}

	return namespace, nil
}

func (resourceManager *ResourceManager) GetNamespaces() ([]*coreV1.Namespace, error) {
	var fetched coreV1.NamespaceList

	if err := resourceManager.List(&fetched); err != nil {
		return nil, err
	}

	res := make([]*coreV1.Namespace, 0, len(fetched.Items))

	for i := range fetched.Items {
		res = append(res, &fetched.Items[i])
	}

	return res, nil
}

func (resourceManager *ResourceManager) CreateNamespace(ns *coreV1.Namespace) error {
	if err := resourceManager.Create(ns); err != nil {
		return err
	}

	return nil
}

func (resourceManager *ResourceManager) DeleteNamespace(ns *coreV1.Namespace) error {
	if err := resourceManager.Delete(ns); err != nil {
		return err
	}

	return nil
}

func (resourceManager *ResourceManager) BuildApplicationDetails(namespace *coreV1.Namespace) (*ApplicationDetails, error) {
	nsName := namespace.Name
	roles := make([]string, 0, 2)

	// review-notes: is this accessReview check still necessary?
	writeReview := &authorizationV1.SelfSubjectAccessReview{
		Spec: authorizationV1.SelfSubjectAccessReviewSpec{
			ResourceAttributes: &authorizationV1.ResourceAttributes{
				Namespace: nsName,
				Resource:  "applications",
				Verb:      "create",
				Group:     "core.kalm.dev",
			},
		},
	}

	// TODO Is there a better way?
	// Infer user roles with some specific access review. This is not accurate but a trade off.
	err := resourceManager.Create(writeReview)

	if err != nil {
		return nil, err
	}

	if writeReview.Status.Allowed {
		roles = append(roles, "writer")
	}

	readReview := &authorizationV1.SelfSubjectAccessReview{
		Spec: authorizationV1.SelfSubjectAccessReviewSpec{
			ResourceAttributes: &authorizationV1.ResourceAttributes{
				Namespace: nsName,
				Resource:  "applications",
				Verb:      "get",
				Group:     "core.kalm.dev",
			},
		},
	}

	err = resourceManager.Create(readReview)

	if err != nil {
		return nil, err
	}

	if readReview.Status.Allowed {
		roles = append(roles, "reader")
	}

	applicationMetric := GetApplicationMetric(nsName)

	istioMetricHistories := &IstioMetricHistories{}

	istioMetricListChan := resourceManager.GetIstioMetricsListChannel(nsName)
	err = <-istioMetricListChan.Error

	if err != nil {
		fmt.Printf("fail to GetIstioMetricsListChannel for ns: %s, ignored, err: %s", nsName, err)
	} else {
		istioMetricHisMap := <-istioMetricListChan.List

		// todo filter out non-kalm service?
		for _, v := range istioMetricHisMap {
			istioMetricHistories = mergeIstioMetricHistories(istioMetricHistories, v)
		}
	}

	return &ApplicationDetails{
		Application: &Application{
			Name: nsName,
		},
		Metrics: MetricHistories{
			CPU:    applicationMetric.CPU,
			Memory: applicationMetric.Memory,
		},
		IstioMetricHistories: istioMetricHistories,
		Roles:                roles,
		Status:               string(namespace.Status.Phase),
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

func (resourceManager *ResourceManager) BuildApplicationListResponse(namespaces []*coreV1.Namespace) ([]ApplicationDetails, error) {
	apps := []ApplicationDetails{}

	// TODO concurrent build response items
	for i := range namespaces {
		ns := namespaces[i]

		if ns.Name == KALM_SYSTEM_NAMESPACE {
			continue
		}

		if _, exist := ns.Labels[controllers.KalmEnableLabelName]; !exist {
			continue
		}

		item, err := resourceManager.BuildApplicationDetails(ns)

		if err != nil {
			return nil, err
		}

		apps = append(apps, *item)
	}

	return apps, nil
}

func GetPodStatus(pod coreV1.Pod, events []coreV1.Event, workloadType v1alpha1.WorkloadType) *PodStatus {
	var ips []string

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

	status := getPodStatusPhase(pod, warnings, workloadType)

	return &PodStatus{
		Name:              pod.Name,
		Node:              pod.Spec.NodeName,
		Status:            status,
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
	if list == nil {
		return nil
	}

	var res []coreV1.Pod

	for i := range list.Items {
		if list.Items[i].Labels["kalm-component"] == componentName {
			res = append(res, list.Items[i])
		}
	}

	return res
}
