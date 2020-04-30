package resources

import (
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"time"
)

type ComponentPluginListChannel struct {
	List  chan []v1alpha1.ComponentPlugin
	Error chan error
}

func (builder *Builder) GetComponentPluginListChannel(listOptions metaV1.ListOptions) *ComponentPluginListChannel {
	channel := &ComponentPluginListChannel{
		List:  make(chan []v1alpha1.ComponentPlugin, 1),
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

		var fetched v1alpha1.ComponentPluginList

		err = client.Get().
			//Namespace(namespaces).
			Resource("componentplugins").
			VersionedParams(&listOptions, metaV1.ParameterCodec).
			Timeout(timeout).
			Do().
			Into(&fetched)

		if err != nil {
			channel.List <- nil
			channel.Error <- err
			return
		}

		res := make([]v1alpha1.ComponentPlugin, len(fetched.Items))

		for i, item := range fetched.Items {
			res[i] = item
		}

		channel.List <- res
		channel.Error <- nil
	}()

	return channel
}
