package resources

import (
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type ComponentListChannel struct {
	List  chan []v1alpha1.Component
	Error chan error
}

func (builder *Builder) GetComponentListChannel(namespaces string, listOptions metaV1.ListOptions) *ComponentListChannel {
	channel := &ComponentListChannel{
		List:  make(chan []v1alpha1.Component, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var fetched v1alpha1.ComponentList
		err := builder.K8sClient.RESTClient().Get().AbsPath("/apis/core.kapp.dev/v1alpha1/" + namespaces + "/components").Do().Into(&fetched)
		res := make([]v1alpha1.Component, len(fetched.Items))

		for i, item := range fetched.Items {
			res[i] = item
		}

		channel.List <- res
		channel.Error <- err
	}()

	return channel
}

type Component struct {
	v1alpha1.ComponentSpec `json:",inline"`
	Name                   string `json:"name"`
}
