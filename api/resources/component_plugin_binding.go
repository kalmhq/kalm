package resources

import (
	"encoding/json"
	"github.com/kapp-staging/kapp/api/errors"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/selection"
	"k8s.io/client-go/rest"
	"time"
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

func (builder *Builder) GetComponentPluginBindingListChannel(namespaces string, listOptions metaV1.ListOptions) *ComponentPluginBindingListChannel {
	channel := &ComponentPluginBindingListChannel{
		List:  make(chan []v1alpha1.ComponentPluginBinding, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var timeout time.Duration

		if listOptions.TimeoutSeconds != nil {
			timeout = time.Duration(*listOptions.TimeoutSeconds) * time.Second
		}

		client, err := builder.KappV1Alpha1()

		if err != nil {
			channel.List <- nil
			channel.Error <- err
			return
		}

		var fetched v1alpha1.ComponentPluginBindingList

		err = client.Get().
			Namespace(namespaces).
			Resource("componentpluginbindings").
			VersionedParams(&listOptions, metaV1.ParameterCodec).
			Timeout(timeout).
			Do().
			Into(&fetched)

		res := make([]v1alpha1.ComponentPluginBinding, len(fetched.Items))

		for i, binding := range fetched.Items {
			res[i] = binding
		}

		channel.List <- res
		channel.Error <- err
	}()

	return channel
}

func UpdateComponentPluginBindingsForObject(kappClient *rest.RESTClient, namespace, componentName string, plugins []runtime.RawExtension) (err error) {
	var oldPluginList v1alpha1.ComponentPluginBindingList
	selector := labels.NewSelector()
	requirement, _ := labels.NewRequirement("kapp-component", selection.Equals, []string{componentName})
	selector = selector.Add(*requirement)

	options := metaV1.ListOptions{
		LabelSelector: selector.String(),
	}

	err = kappClient.Get().
		Namespace(namespace).
		Resource("componentpluginbindings").
		VersionedParams(&options, metaV1.ParameterCodec).
		Do().
		Into(&oldPluginList)

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
					"kapp-component": componentName,
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
		err := kappClient.Post().
			Namespace(namespace).
			Resource("componentpluginbindings").
			Body(np).
			Do().
			Into(np)

		if errors.IsAlreadyExists(err) {
			continue
		}

		if err != nil {
			return err
		}
	}

	for name := range shouldDelete {
		err := kappClient.Delete().
			Namespace(namespace).
			Resource("componentpluginbindings").
			Name(name).
			Do().
			Error()

		if err != nil {
			return err
		}
	}

	return nil
}
