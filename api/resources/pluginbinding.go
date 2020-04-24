package resources

import (
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"time"
)

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
