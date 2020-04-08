package resources

import (
	"github.com/sirupsen/logrus"
	appV1 "k8s.io/api/apps/v1"
	coreV1 "k8s.io/api/core/v1"
	rbacV1 "k8s.io/api/rbac/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/fields"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/selection"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

type ResourceChannels struct {
	//ReplicaSetList *ReplicaSetListChannel
	DeploymentList *DeploymentListChannel
	PodList        *PodListChannel
	EventList      *EventListChannel
	//PodMetricsList *PodMetricsListChannel
	RoleBindingList *RoleBindingListChannel
	NamespaceList   *NamespaceListChannel
}

type Resources struct {
	//ReplicaSetList *appV1.ReplicaSetList
	DeploymentList *appV1.DeploymentList
	PodList        *coreV1.PodList
	EventList      *coreV1.EventList
	//PodMetricsList *metricv1beta1.PodMetricsList
	RoleBindings []rbacV1.RoleBinding
	Namespaces   []coreV1.Namespace
}

var ListAll = metaV1.ListOptions{
	LabelSelector: labels.Everything().String(),
	FieldSelector: fields.Everything().String(),
}

var AllNamespaces = ""

func (c *ResourceChannels) ToResources() (r *Resources, err error) {
	resources := &Resources{}

	//if c.ReplicaSetList != nil {
	//	err = <-c.ReplicaSetList.Error
	//	if err != nil {
	//		return nil, err
	//	}
	//	resources.ReplicaSetList = <-c.ReplicaSetList.List
	//}

	if c.DeploymentList != nil {
		err = <-c.DeploymentList.Error
		if err != nil {
			return nil, err
		}
		resources.DeploymentList = <-c.DeploymentList.List
	}

	if c.PodList != nil {
		err = <-c.PodList.Error
		if err != nil {
			return nil, err
		}
		resources.PodList = <-c.PodList.List
	}

	if c.EventList != nil {
		err = <-c.EventList.Error
		if err != nil {
			return nil, err
		}
		resources.EventList = <-c.EventList.List
	}

	if c.RoleBindingList != nil {
		err = <-c.RoleBindingList.Error
		if err != nil {
			return nil, err
		}
		resources.RoleBindings = <-c.RoleBindingList.List
	}

	if c.NamespaceList != nil {
		err = <-c.NamespaceList.Error
		if err != nil {
			return nil, err
		}
		resources.Namespaces = <-c.NamespaceList.List
	}

	//if c.PodMetricsList != nil {
	//	err = <-c.PodMetricsList.Error
	//	if err != nil {
	//		return nil, err
	//	}
	//	resources.PodMetricsList = <-c.PodMetricsList.List
	//}

	return resources, nil
}

func filterPodEventsWithType(events []coreV1.Event, pods []coreV1.Pod, eventType string) []coreV1.Event {
	result := make([]coreV1.Event, 0)
	podEventMap := make(map[types.UID]bool, 0)

	if len(pods) == 0 || len(events) == 0 {
		return result
	}

	for _, pod := range pods {
		podEventMap[pod.UID] = true
	}

	for _, event := range events {
		if _, exists := podEventMap[event.InvolvedObject.UID]; exists {
			if eventType == "" || eventType == event.Type {
				result = append(result, event)
			}
		}
	}

	return result
}

// Returns true if given pod is in state ready or succeeded, false otherwise
func IsReadyOrSucceeded(pod coreV1.Pod) bool {
	if pod.Status.Phase == coreV1.PodSucceeded {
		return true
	}
	if pod.Status.Phase == coreV1.PodRunning {
		for _, c := range pod.Status.Conditions {
			if c.Type == coreV1.PodReady {
				if c.Status == coreV1.ConditionFalse {
					return false
				}
			}
		}

		return true
	}

	return false
}

func filterPodWarningEvents(events []coreV1.Event, pods []coreV1.Pod) []coreV1.Event {
	return filterPodEventsWithType(events, pods, coreV1.EventTypeWarning)
}

func matchLabel(key, value string) metaV1.ListOptions {
	selector := labels.NewSelector()
	requirement, _ := labels.NewRequirement(key, selection.Equals, []string{value})
	selector = selector.Add(*requirement)
	return metaV1.ListOptions{
		LabelSelector: selector.String(),
	}
}

func labelsBelongsToApplication(name string) metaV1.ListOptions {
	return matchLabel("kapp-application", name)
}

type Builder struct {
	K8sClient *kubernetes.Clientset
	Logger    *logrus.Logger
	Config    *rest.Config
}
