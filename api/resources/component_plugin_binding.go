package resources

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/kapp-staging/kapp/api/errors"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/selection"
	"k8s.io/client-go/rest"
	"time"
)

type Plugin struct {
	Name   string                `json:"name"`
	Config *runtime.RawExtension `json:"config"`
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
	newPlugins := map[string]*Plugin{}

	for _, plugin := range plugins {
		var tmp Plugin
		_ = json.Unmarshal(plugin.Raw, &tmp)
		newPlugins[tmp.Name] = &tmp
	}

	for _, binding := range oldPluginList.Items {
		oldPlugins[binding.Spec.PluginName] = &binding
	}

	shouldCreate := map[string]*Plugin{}
	shouldDelete := map[string]*v1alpha1.ComponentPluginBinding{}
	shouldUpdate := map[string]*v1alpha1.ComponentPluginBinding{}

	for n, np := range newPlugins {
		if _, ok := oldPlugins[n]; ok {
			if oldPlugins[n].Spec.Config != np.Config {
				if oldPlugins[n].Spec.Config != nil && np.Config != nil && bytes.Compare(oldPlugins[n].Spec.Config.Raw, np.Config.Raw) == 0 {
					continue
				}
				oldPlugins[n].Spec.Config = np.Config
				shouldUpdate[n] = oldPlugins[n]
			}
		} else {
			shouldCreate[n] = np
		}
	}

	for n, op := range oldPlugins {
		if _, ok := newPlugins[n]; !ok {
			shouldDelete[n] = op
		}
	}

	for _, np := range shouldCreate {
		err := CreateComponentPluginBinding(kappClient, namespace, componentName, np.Name, np.Config)

		if errors.IsAlreadyExists(err) {
			continue
		}

		if err != nil {
			return err
		}
	}

	for _, op := range shouldDelete {
		err := DeleteComponentPluginBinding(kappClient, namespace, op.Name)

		if err != nil {
			return err
		}
	}

	for _, op := range shouldUpdate {
		err := kappClient.Put().
			Namespace(namespace).
			Resource("componentpluginbindings").
			Name(op.Name).
			Body(op).
			Do().
			Into(op)

		if err != nil {
			return err
		}
	}

	return nil
}

func CreateComponentPluginBinding(kappClient *rest.RESTClient, namespace, componentName string, pluginName string, config *runtime.RawExtension) error {
	var bindingName string
	bindingLabels := make(map[string]string)
	bindingLabels["kapp-component"] = componentName

	bindingName = pluginName

	if componentName != "" {
		bindingName = fmt.Sprintf("%s-%s", componentName, pluginName)
	}

	binding := &v1alpha1.ComponentPluginBinding{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      bindingName,
			Namespace: namespace,
			Labels:    bindingLabels,
		},
		Spec: v1alpha1.ComponentPluginBindingSpec{
			PluginName:    pluginName,
			ComponentName: componentName,
			Config:        config,
		},
	}

	return kappClient.Post().
		Namespace(namespace).
		Resource("componentpluginbindings").
		Body(binding).
		Do().
		Into(binding)
}

func DeleteComponentPluginBinding(kappClient *rest.RESTClient, namespace, name string) error {
	return kappClient.Delete().
		Namespace(namespace).
		Resource("componentpluginbindings").
		Name(name).
		//Body(&metaV1.DeleteOptions{}).
		Do().
		Error()
}
