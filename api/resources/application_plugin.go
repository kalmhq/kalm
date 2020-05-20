package resources

import (
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	"k8s.io/apimachinery/pkg/runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type ApplicationPlugin struct {
	Name         string                `json:"name"`
	Src          string                `json:"src"`
	ConfigSchema *runtime.RawExtension `json:"configSchema"`
}

type ApplicationPluginListChannel struct {
	List  chan []v1alpha1.ApplicationPlugin
	Error chan error
}

func (builder *Builder) GetApplicationPluginListChannel(opts ...client.ListOption) *ApplicationPluginListChannel {
	channel := &ApplicationPluginListChannel{
		List:  make(chan []v1alpha1.ApplicationPlugin, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var applicationPluginList v1alpha1.ApplicationPluginList
		err := builder.List(&applicationPluginList, opts...)

		if err != nil {
			channel.List <- nil
			channel.Error <- err
			return
		}

		res := make([]v1alpha1.ApplicationPlugin, len(applicationPluginList.Items))

		for i, item := range applicationPluginList.Items {
			res[i] = item
		}

		channel.List <- res
		channel.Error <- nil
	}()

	return channel
}

func (builder *Builder) GetApplicationPlugins() ([]ApplicationPlugin, error) {
	resourceChannels := &ResourceChannels{
		ApplicationPluginList: builder.GetApplicationPluginListChannel(),
	}

	resources, err := resourceChannels.ToResources()

	if err != nil {
		builder.Logger.Error(err)
		return nil, err
	}

	res := make([]ApplicationPlugin, len(resources.ApplicationPlugins))

	for i, plugin := range resources.ApplicationPlugins {
		res[i] = ApplicationPlugin{
			Name:         plugin.Name,
			Src:          plugin.Spec.Src,
			ConfigSchema: plugin.Spec.ConfigSchema,
		}
	}

	return res, nil
}
