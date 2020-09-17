package resources

import (
	"encoding/json"
	"github.com/kalmhq/kalm/api/errors"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/selection"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type ComponentPluginBinding struct {
	Name     string                `json:"name"`
	Config   *runtime.RawExtension `json:"config"`
	IsActive bool                  `json:"isActive"`
}

type ComponentPluginBindingListChannel struct {
	List  chan []v1alpha1.ComponentPluginBinding
	Error chan error
}

func (resourceManager *ResourceManager) GetComponentPluginBindingListChannel(opts ...client.ListOption) *ComponentPluginBindingListChannel {
	channel := &ComponentPluginBindingListChannel{
		List:  make(chan []v1alpha1.ComponentPluginBinding, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var list v1alpha1.ComponentPluginBindingList
		err := resourceManager.List(&list, opts...)
		res := make([]v1alpha1.ComponentPluginBinding, len(list.Items))

		for i, binding := range list.Items {
			res[i] = binding
		}

		channel.List <- res
		channel.Error <- err
	}()

	return channel
}

func (resourceManager *ResourceManager) UpdateComponentPluginBindingsForObject(namespace, componentName string, plugins []runtime.RawExtension) (err error) {
	var oldPluginList v1alpha1.ComponentPluginBindingList
	selector := labels.NewSelector()
	requirement, _ := labels.NewRequirement("kalm-component", selection.Equals, []string{componentName})
	selector = selector.Add(*requirement)

	err = resourceManager.List(&oldPluginList, client.MatchingLabelsSelector{selector})

	if err != nil {
		return err
	}

	oldPlugins := map[string]*v1alpha1.ComponentPluginBinding{}
	newPlugins := map[string]*v1alpha1.ComponentPluginBinding{}

	for _, pluginRaw := range plugins {
		var plugin ComponentPluginBinding
		_ = json.Unmarshal(pluginRaw.Raw, &plugin)

		binding := &v1alpha1.ComponentPluginBinding{
			ObjectMeta: metaV1.ObjectMeta{
				Namespace: namespace,
				Labels: map[string]string{
					"kalm-component": componentName,
				},
			},
			Spec: v1alpha1.ComponentPluginBindingSpec{
				Config:        plugin.Config,
				ComponentName: componentName,
				PluginName:    plugin.Name,
				IsDisabled:    !plugin.IsActive,
			},
		}

		binding.Name = binding.Spec.GetName()
		newPlugins[binding.Name] = binding
	}

	for _, binding := range oldPluginList.Items {
		oldPlugins[binding.Name] = &binding
	}

	shouldCreate := map[string]*v1alpha1.ComponentPluginBinding{}
	shouldDelete := map[string]*v1alpha1.ComponentPluginBinding{}

	for name, np := range newPlugins {
		if _, ok := oldPlugins[name]; !ok {
			shouldCreate[name] = np
		}
	}

	for name, op := range oldPlugins {
		if _, ok := newPlugins[name]; !ok {
			shouldDelete[name] = op
		}
	}

	for _, np := range shouldCreate {
		err := resourceManager.Create(np)

		if errors.IsAlreadyExists(err) {
			continue
		}

		if err != nil {
			return err
		}
	}

	for name := range shouldDelete {
		err := resourceManager.Delete(&v1alpha1.ComponentPluginBinding{ObjectMeta: metaV1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
		}})

		if err != nil {
			return err
		}
	}

	return nil
}
