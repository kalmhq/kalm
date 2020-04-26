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

type PluginBindingListChannel struct {
	List  chan []v1alpha1.PluginBinding
	Error chan error
}

func (builder *Builder) GetPluginBindingListChannel(namespaces string, listOptions metaV1.ListOptions) *PluginBindingListChannel {
	channel := &PluginBindingListChannel{
		List:  make(chan []v1alpha1.PluginBinding, 1),
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

		var fetched v1alpha1.PluginBindingList

		err = client.Get().
			Namespace(namespaces).
			Resource("pluginbindings").
			VersionedParams(&listOptions, metaV1.ParameterCodec).
			Timeout(timeout).
			Do().
			Into(&fetched)

		res := make([]v1alpha1.PluginBinding, len(fetched.Items))

		for i, binding := range fetched.Items {
			res[i] = binding
		}

		channel.List <- res
		channel.Error <- err
	}()

	return channel
}

func UpdatePluginBindingsForObject(kappClient *rest.RESTClient, namespace, scope, ownerName string, plugins []runtime.RawExtension) (err error) {
	var oldPluginList v1alpha1.PluginBindingList
	selector := labels.NewSelector()
	requirement, _ := labels.NewRequirement("scope", selection.Equals, []string{scope})
	selector = selector.Add(*requirement)

	if scope == "component" {
		requirement, _ := labels.NewRequirement("kapp-component", selection.Equals, []string{ownerName})
		selector = selector.Add(*requirement)
	}

	options := metaV1.ListOptions{
		LabelSelector: selector.String(),
	}

	err = kappClient.Get().
		Namespace(namespace).
		Resource("pluginbindings").
		VersionedParams(&options, metaV1.ParameterCodec).
		Do().
		Into(&oldPluginList)

	if err != nil {
		return err
	}

	oldPlugins := map[string]*v1alpha1.PluginBinding{}
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
	shouldDelete := map[string]*v1alpha1.PluginBinding{}
	shouldUpdate := map[string]*v1alpha1.PluginBinding{}

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
		err := CreatePluginBinding(kappClient, namespace, scope, ownerName, np.Name, np.Config)

		if errors.IsAlreadyExists(err) {
			continue
		}

		if err != nil {
			return err
		}
	}

	for _, op := range shouldDelete {
		err := DeletePluginBinding(kappClient, namespace, op.Name)

		if err != nil {
			return err
		}
	}

	for _, op := range shouldUpdate {
		err := kappClient.Put().
			Namespace(namespace).
			Resource("pluginbindings").
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

func CreatePluginBinding(kappClient *rest.RESTClient, namespace, scope, ownerName string, pluginName string, config *runtime.RawExtension) error {
	bindingLabels := make(map[string]string)

	bindingLabels["scope"] = scope

	var componentName string
	var bindingName string

	if scope == "application" {
		bindingLabels["kapp-application"] = ownerName
		bindingName = pluginName
	} else {
		bindingLabels["kapp-component"] = ownerName
		bindingName = fmt.Sprintf("%s-%s", ownerName, pluginName)
		componentName = ownerName
	}

	binding := &v1alpha1.PluginBinding{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      bindingName,
			Namespace: namespace,
			Labels:    bindingLabels,
		},
		Spec: v1alpha1.PluginBindingSpec{
			PluginName:    pluginName,
			ComponentName: componentName,
			Scope:         scope,
			Config:        config,
		},
	}

	return kappClient.Post().
		Namespace(namespace).
		Resource("pluginbindings").
		Body(binding).
		Do().
		Into(binding)
}

func DeletePluginBinding(kappClient *rest.RESTClient, namespace, name string) error {
	return kappClient.Delete().
		Namespace(namespace).
		Resource("pluginbindings").
		Name(name).
		//Body(&metaV1.DeleteOptions{}).
		Do().
		Error()
}

func CreateComponentPluginBinding() {

}
