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
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type ApplicationPluginBinding struct {
	Name     string                `json:"name"`
	Config   *runtime.RawExtension `json:"config"`
	IsActive bool                  `json:"isActive"`
}

type ApplicationPluginBindingListChannel struct {
	List  chan []v1alpha1.ApplicationPluginBinding
	Error chan error
}

func (builder *Builder) GetApplicationPluginBindingListChannel(opts ...client.ListOption) *ApplicationPluginBindingListChannel {
	channel := &ApplicationPluginBindingListChannel{
		List:  make(chan []v1alpha1.ApplicationPluginBinding, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var list v1alpha1.ApplicationPluginBindingList
		err := builder.List(&list, opts...)

		if err != nil {
			channel.List <- nil
			channel.Error <- err
			return
		}

		res := make([]v1alpha1.ApplicationPluginBinding, len(list.Items))

		for i, binding := range list.Items {
			res[i] = binding
		}

		channel.List <- res
		channel.Error <- err
	}()

	return channel
}

func UpdateApplicationPluginBindingsForObject(kappClient *rest.RESTClient, namespace, applicationName string, plugins []runtime.RawExtension) (err error) {
	var oldPluginList v1alpha1.ApplicationPluginBindingList
	selector := labels.NewSelector()
	requirement, _ := labels.NewRequirement("kapp-application", selection.Equals, []string{applicationName})
	selector = selector.Add(*requirement)

	options := metaV1.ListOptions{
		LabelSelector: selector.String(),
	}

	err = kappClient.Get().
		Namespace(namespace).
		Resource("applicationpluginbindings").
		VersionedParams(&options, metaV1.ParameterCodec).
		Do().
		Into(&oldPluginList)

	if err != nil {
		return err
	}

	oldPlugins := map[string]*v1alpha1.ApplicationPluginBinding{}
	newPlugins := map[string]*v1alpha1.ApplicationPluginBinding{}

	for _, pluginRaw := range plugins {
		var plugin ApplicationPluginBinding
		_ = json.Unmarshal(pluginRaw.Raw, &plugin)

		binding := &v1alpha1.ApplicationPluginBinding{
			ObjectMeta: metaV1.ObjectMeta{
				Namespace: namespace,
				Labels: map[string]string{
					"kapp-application": applicationName,
				},
			},
			Spec: v1alpha1.ApplicationPluginBindingSpec{
				Config:     plugin.Config,
				PluginName: plugin.Name,
				IsDisabled: !plugin.IsActive,
			},
		}

		binding.Name = binding.Spec.GetName()
		newPlugins[binding.Name] = binding
	}

	for _, binding := range oldPluginList.Items {
		oldPlugins[binding.Name] = &binding
	}

	shouldCreate := map[string]*v1alpha1.ApplicationPluginBinding{}
	shouldDelete := map[string]*v1alpha1.ApplicationPluginBinding{}

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
			Resource("applicationpluginbindings").
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
			Resource("applicationpluginbindings").
			Name(name).
			Do().
			Error()

		if err != nil {
			return err
		}
	}

	return nil
}
