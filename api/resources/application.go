package resources

import (
	"fmt"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	appsV1 "k8s.io/api/apps/v1"
	v1betav1 "k8s.io/api/batch/v1beta1"
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/fields"
	"k8s.io/apimachinery/pkg/labels"
	"time"
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

	// TODO, cpu, memory usage time series
	Metrics interface{} `json:"metrics"`
}

type ApplicationListResponseItem struct {
	Name       string             `json:"name"`
	Namespace  string             `json:"namespace"`
	CreatedAt  time.Time          `json:"createdAt"`
	IsEnabled  bool               `json:"isEnabled"`
	Components []*ComponentStatus `json:"components"`
}

type ApplicationListResponse struct {
	//ListMeta     *ListMeta                      `json:"listMeta"`
	Applications []*ApplicationListResponseItem `json:"applications"`
}

type ApplicationResponse struct {
	Application *Application `json:"application"`
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
	formatEnvs(application.Spec.SharedEnv)
	formatApplicationComponents(application.Spec.Components)

	return &ApplicationResponse{
		&Application{
			Name:       application.Name,
			Namespace:  application.Namespace,
			IsActive:   application.Status.IsActive,
			SharedEnvs: application.Spec.SharedEnv,
			Components: application.Spec.Components,
		},
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
	}

	resources, err := resourceChannels.ToResources()

	if err != nil {
		builder.Logger.Error(err)
	}

	return &ApplicationListResponseItem{
		Name:       application.ObjectMeta.Name,
		Namespace:  application.ObjectMeta.Namespace,
		IsEnabled:  application.Status.IsActive,
		CreatedAt:  application.ObjectMeta.CreationTimestamp.Time,
		Components: builder.buildApplicationComponentStatus(application, resources),
	}
}

func (builder *Builder) buildApplicationComponentStatus(application *v1alpha1.Application, resources *Resources) []*ComponentStatus {
	res := []*ComponentStatus{}

	for i := range application.Spec.Components {
		component := application.Spec.Components[i]

		componentStatus := &ComponentStatus{
			Name:             component.Name,
			WorkloadType:     component.WorkLoadType,
			DeploymentStatus: appsV1.DeploymentStatus{},
			CronjobStatus:    v1betav1.CronJobStatus{},
			PodInfo:          &PodInfo{},
			Metrics:          nil, // TODO
		}

		// TODO fix the default value, there should be a empty string
		if component.WorkLoadType == v1alpha1.WorkLoadTypeServer || component.WorkLoadType == "" {

			deploymentName := fmt.Sprintf("%s-%s", application.Name, component.Name)
			deployment := findDeploymentByName(resources.DeploymentList, deploymentName)

			if deployment == nil {
				builder.Logger.Errorf("Can't find deployment with name %s", deploymentName)
			} else {
				componentStatus.DeploymentStatus = deployment.Status
				pods := findPods(resources.PodList, component.Name)
				componentStatus.PodInfo = getPodsInfo(deployment.Status.Replicas, deployment.Spec.Replicas, pods)
				componentStatus.PodInfo.Warnings = filterPodWarningEvents(resources.EventList.Items, pods)
			}
		}

		// TODO
		//if component.WorkLoadType == v1alpha1.WorkLoadTypeCronjob {
		//	componentStatus.CronjobStatus = v1betav1.CronJobStatus{}
		//}

		res = append(res, componentStatus)
	}
	return res
}

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
