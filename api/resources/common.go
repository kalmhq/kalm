package resources

import (
	"context"
	"fmt"
	"github.com/go-logr/logr"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	appV1 "k8s.io/api/apps/v1"
	coreV1 "k8s.io/api/core/v1"
	rbacV1 "k8s.io/api/rbac/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/fields"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/selection"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func init() {
	_ = v1alpha1.AddToScheme(scheme.Scheme)
}

type ResourceChannels struct {
	DeploymentList             *DeploymentListChannel
	PodList                    *PodListChannel
	EventList                  *EventListChannel
	ServiceList                *ServiceListChannel
	RoleBindingList            *RoleBindingListChannel
	NamespaceList              *NamespaceListChannel
	ComponentList              *ComponentListChannel
	ComponentPluginList        *ComponentPluginListChannel
	ComponentPluginBindingList *ComponentPluginBindingListChannel
	DockerRegistryList         *DockerRegistryListChannel
	SecretList                 *SecretListChannel
	IstioMetricList            *IstioMetricListChannel
	ProtectedEndpoint          *ProtectedEndpointsChannel
}

type Resources struct {
	IstioMetricHistories    map[string]*IstioMetricHistories
	DeploymentList          *appV1.DeploymentList
	PodList                 *coreV1.PodList
	EventList               *coreV1.EventList
	Services                []coreV1.Service
	RoleBindings            []rbacV1.RoleBinding
	Namespaces              []Namespace
	Components              []v1alpha1.Component
	ComponentPlugins        []v1alpha1.ComponentPlugin
	ComponentPluginBindings []v1alpha1.ComponentPluginBinding
	//ApplicationPlugins        []v1alpha1.ApplicationPlugin
	//ApplicationPluginBindings []v1alpha1.ApplicationPluginBinding
	DockerRegistries  []v1alpha1.DockerRegistry
	Secrets           []coreV1.Secret
	HttpsCertIssuers  []v1alpha1.HttpsCertIssuer
	ProtectedEndpoint []v1alpha1.ProtectedEndpoint
}

var ListAll = metaV1.ListOptions{
	LabelSelector: labels.Everything().String(),
	FieldSelector: fields.Everything().String(),
}

var AllNamespaces = ""

func (c *ResourceChannels) ToResources() (r *Resources, err error) {
	resources := &Resources{}

	if c.IstioMetricList != nil {
		err = <-c.IstioMetricList.Error
		if err != nil {
			fmt.Printf("err when querying istioMetricList, ignored, err: %s", err)
		} else {
			resources.IstioMetricHistories = <-c.IstioMetricList.List
		}
	}

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

	if c.ServiceList != nil {
		err = <-c.ServiceList.Error
		if err != nil {
			return nil, err
		}
		resources.Services = <-c.ServiceList.List
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

	if c.ComponentList != nil {
		err = <-c.ComponentList.Error
		if err != nil {
			return nil, err
		}
		resources.Components = <-c.ComponentList.List
	}

	if c.ComponentPluginList != nil {
		err = <-c.ComponentPluginList.Error
		if err != nil {
			return nil, err
		}
		resources.ComponentPlugins = <-c.ComponentPluginList.List
	}

	if c.ComponentPluginBindingList != nil {
		err = <-c.ComponentPluginBindingList.Error
		if err != nil {
			return nil, err
		}
		resources.ComponentPluginBindings = <-c.ComponentPluginBindingList.List
	}

	if c.DockerRegistryList != nil {
		err = <-c.DockerRegistryList.Error
		if err != nil {
			return nil, err
		}
		resources.DockerRegistries = <-c.DockerRegistryList.List
	}

	if c.SecretList != nil {
		err = <-c.SecretList.Error
		if err != nil {
			return nil, err
		}
		resources.Secrets = <-c.SecretList.List
	}

	if c.ProtectedEndpoint != nil {
		err = <-c.ProtectedEndpoint.Error
		if err != nil {
			return nil, err
		}
		resources.ProtectedEndpoint = <-c.ProtectedEndpoint.List
	}

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
	return matchLabel("kalm-application", name)
}

type Builder struct {
	ctx       context.Context
	K8sClient *kubernetes.Clientset
	Client    client.Client
	Logger    logr.Logger
}

func NewBuilder(k8sClient *kubernetes.Clientset, cfg *rest.Config, logger logr.Logger) *Builder {
	c, err := client.New(cfg, client.Options{Scheme: scheme.Scheme})
	if err != nil {
		return nil
	}

	return &Builder{
		ctx:       context.Background(), // TODO
		K8sClient: k8sClient,
		Client:    c,
		Logger:    logger,
	}
}

func (builder *Builder) Get(namespace, name string, obj runtime.Object) error {
	return builder.Client.Get(builder.ctx, types.NamespacedName{Namespace: namespace, Name: name}, obj)
}

func (builder *Builder) List(obj runtime.Object, opts ...client.ListOption) error {
	return builder.Client.List(builder.ctx, obj, opts...)
}

func (builder *Builder) Create(obj runtime.Object, opts ...client.CreateOption) error {
	return builder.Client.Create(builder.ctx, obj, opts...)
}

func (builder *Builder) Delete(obj runtime.Object, opts ...client.DeleteOption) error {
	return builder.Client.Delete(builder.ctx, obj, opts...)
}

func (builder *Builder) Update(obj runtime.Object, opts ...client.UpdateOption) error {
	return builder.Client.Update(builder.ctx, obj, opts...)
}

func (builder *Builder) Patch(obj runtime.Object, patch client.Patch, opts ...client.PatchOption) error {
	return builder.Client.Patch(builder.ctx, obj, patch, opts...)
}

// client Side apply
func (builder *Builder) Apply(obj runtime.Object) error {
	//newObject, err := scheme.Scheme.New(obj.GetObjectKind().GroupVersionKind())

	//if err != nil {
	//	return err
	//}

	//objectKey, err := client.ObjectKeyFromObject(obj)

	//if err != nil {
	//	return err
	//}

	//if err := builder.Get(objectKey.Namespace, objectKey.Name, newObject); err != nil {
	//	return err
	//}

	return builder.Patch(obj, client.Merge)
}
