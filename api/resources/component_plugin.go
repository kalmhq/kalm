package resources

import (
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

type ComponentPlugin struct {
	Name         string                `json:"name"`
	Src          string                `json:"src"`
	ConfigSchema *runtime.RawExtension `json:"configSchema"`
	//Users        []string              `json:"users,omitempty"`
}

type ComponentPluginListChannel struct {
	List  chan []v1alpha1.ComponentPlugin
	Error chan error
}

func (resourceManager *ResourceManager) GetComponentPluginListChannel(listOptions metaV1.ListOptions) *ComponentPluginListChannel {
	channel := &ComponentPluginListChannel{
		List:  make(chan []v1alpha1.ComponentPlugin, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var fetched v1alpha1.ComponentPluginList

		err := resourceManager.List(&fetched)

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

func (resourceManager *ResourceManager) GetComponentPlugins() ([]ComponentPlugin, error) {
	resourceChannels := &ResourceChannels{
		ComponentPluginList: resourceManager.GetComponentPluginListChannel(ListAll),
	}

	resources, err := resourceChannels.ToResources()

	if err != nil {
		resourceManager.Logger.Error(err, "channels to resources error")
		return nil, err
	}

	res := make([]ComponentPlugin, len(resources.ComponentPlugins))

	for i, plugin := range resources.ComponentPlugins {
		res[i] = ComponentPlugin{
			Name:         plugin.Name,
			Src:          plugin.Spec.Src,
			ConfigSchema: plugin.Spec.ConfigSchema,
		}
	}

	return res, nil
}
