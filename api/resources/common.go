package resources

import (
	"context"
	"errors"
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
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
	"reflect"
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
	NamespaceList              *NamespaceListChannel
	ComponentList              *ComponentListChannel
	ComponentPluginList        *ComponentPluginListChannel
	ComponentPluginBindingList *ComponentPluginBindingListChannel
	DockerRegistryList         *DockerRegistryListChannel
	SecretList                 *SecretListChannel
	IstioMetricList            *IstioMetricListChannel
	ProtectedEndpointList      *ProtectedEndpointListChannel
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
	DockerRegistries   []v1alpha1.DockerRegistry
	Secrets            []coreV1.Secret
	HttpsCertIssuers   []v1alpha1.HttpsCertIssuer
	ProtectedEndpoints []v1alpha1.ProtectedEndpoint
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

	if c.ProtectedEndpointList != nil {
		err = <-c.ProtectedEndpointList.Error
		if err != nil {
			return nil, err
		}
		resources.ProtectedEndpoints = <-c.ProtectedEndpointList.List
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

type ResourceManager struct {
	ctx    context.Context
	Cfg    *rest.Config
	Client client.Client
	Logger logr.Logger
}

func NewResourceManager(cfg *rest.Config, logger logr.Logger) *ResourceManager {
	c, err := client.New(cfg, client.Options{Scheme: scheme.Scheme})

	if err != nil {
		return nil
	}

	return &ResourceManager{
		Cfg:    cfg,
		ctx:    context.Background(), // TODO
		Client: c,
		Logger: logger,
	}
}

func (resourceManager *ResourceManager) Get(namespace, name string, obj runtime.Object) error {
	return resourceManager.Client.Get(resourceManager.ctx, types.NamespacedName{Namespace: namespace, Name: name}, obj)
}

func (resourceManager *ResourceManager) List(obj runtime.Object, opts ...client.ListOption) error {
	return resourceManager.Client.List(resourceManager.ctx, obj, opts...)
}

func (resourceManager *ResourceManager) Create(obj runtime.Object, opts ...client.CreateOption) error {
	return resourceManager.Client.Create(resourceManager.ctx, obj, opts...)
}

func (resourceManager *ResourceManager) Delete(obj runtime.Object, opts ...client.DeleteOption) error {
	return resourceManager.Client.Delete(resourceManager.ctx, obj, opts...)
}

func (resourceManager *ResourceManager) Update(obj runtime.Object, opts ...client.UpdateOption) error {
	return resourceManager.Client.Update(resourceManager.ctx, obj, opts...)
}

func (resourceManager *ResourceManager) Patch(obj runtime.Object, patch client.Patch, opts ...client.PatchOption) error {
	return resourceManager.Client.Patch(resourceManager.ctx, obj, patch, opts...)
}

// client Side apply
func (resourceManager *ResourceManager) Apply(obj runtime.Object) error {
	fetched, err := scheme.Scheme.New(obj.GetObjectKind().GroupVersionKind())

	if err != nil {
		return err
	}

	objectKey, err := client.ObjectKeyFromObject(obj)

	if err != nil {
		return err
	}

	if err := resourceManager.Get(objectKey.Namespace, objectKey.Name, fetched); err != nil {
		return err
	}

	fetchedCopy := fetched.DeepCopyObject()

	setSpec(obj, fetchedCopy)
	obj = fetchedCopy

	return resourceManager.Patch(obj, client.MergeFrom(fetched))
}

// setField sets field of v with given name to given value.
func setSpec(fromObject interface{}, toObject interface{}) interface{} {
	// fromObject must be a pointer to a struct
	rv := reflect.ValueOf(fromObject)
	if rv.Kind() != reflect.Ptr || rv.Elem().Kind() != reflect.Struct {
		return errors.New("fromObject must be pointer to obj.runtime")
	}

	rv2 := reflect.ValueOf(toObject)
	if rv2.Kind() != reflect.Ptr || rv2.Elem().Kind() != reflect.Struct {
		return errors.New("toObject must be pointer to obj.runtime")
	}

	if reflect.TypeOf(fromObject) != reflect.TypeOf(toObject) {
		return errors.New("fromObject and toObject must be the same CRD type")
	}

	// Dereference pointer
	rv = rv.Elem()
	rv2 = rv2.Elem()

	// Lookup field by name
	fv := rv.FieldByName("Spec")

	if !fv.IsValid() {
		return fmt.Errorf("not a field name: Spec")
	}

	fv2 := rv2.FieldByName("Spec")

	if !fv2.IsValid() {
		return fmt.Errorf("not a field name: Spec")
	}

	fv2.Set(fv)

	return nil
}
