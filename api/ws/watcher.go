package ws

import (
	"errors"

	"github.com/kalm-staging/kalm/api/handler"
	"github.com/kalm-staging/kalm/api/resources"
	"github.com/kalm-staging/kalm/controller/api/v1alpha1"
	"github.com/kalm-staging/kalm/controller/controllers"
	log "github.com/sirupsen/logrus"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	toolscache "k8s.io/client-go/tools/cache"
	"sigs.k8s.io/controller-runtime/pkg/cache"
)

func StartWatching(c *Client) {
	informerCache, err := cache.New(c.K8SClientConfig, cache.Options{})
	if err != nil {
		log.Error(err)
		return
	}

	registerWatchHandler(c, &informerCache, &coreV1.Namespace{}, buildNamespaceResMessage)
	registerWatchHandler(c, &informerCache, &v1alpha1.Component{}, buildComponentResMessage)
	registerWatchHandler(c, &informerCache, &coreV1.Service{}, buildServiceResMessage)
	registerWatchHandler(c, &informerCache, &coreV1.Pod{}, buildPodResMessage)
	registerWatchHandler(c, &informerCache, &v1alpha1.HttpRoute{}, buildHttpRouteResMessage)
	registerWatchHandler(c, &informerCache, &coreV1.Node{}, buildNodeResMessage)
	registerWatchHandler(c, &informerCache, &v1alpha1.HttpsCert{}, buildHttpsCertResMessage)
	registerWatchHandler(c, &informerCache, &v1alpha1.DockerRegistry{}, buildRegistryResMessage)
	registerWatchHandler(c, &informerCache, &coreV1.PersistentVolumeClaim{}, buildVolumeResMessage)

	// stop := make(chan struct{})
	// defer close(stop)
	informerCache.Start(c.StopWatcher)
}

func registerWatchHandler(c *Client,
	informerCache *cache.Cache,
	runtimeObj runtime.Object,
	buildResMessage func(c *Client, action string, obj interface{}) (*ResMessage, error)) {

	informer, err := (*informerCache).GetInformer(runtimeObj)
	if err != nil {
		log.Error(err)
		return
	}

	informer.AddEventHandler(toolscache.ResourceEventHandlerFuncs{
		AddFunc: func(obj interface{}) {
			resMessage, err := buildResMessage(c, "Add", obj)
			if err != nil {
				log.Warn(err)
				return
			}
			c.sendResMessage(resMessage)
		},
		DeleteFunc: func(obj interface{}) {
			resMessage, err := buildResMessage(c, "Delete", obj)
			if err != nil {
				log.Warn(err)
				return
			}
			c.sendResMessage(resMessage)
		},
		UpdateFunc: func(oldObj, obj interface{}) {
			resMessage, err := buildResMessage(c, "Update", obj)
			if err != nil {
				log.Warn(err)
				return
			}
			c.sendResMessage(resMessage)
		},
	})

}

func buildNamespaceResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	namespace, ok := objWatched.(*coreV1.Namespace)
	if !ok {
		return nil, errors.New("convert watch obj to Namespace failed")
	}

	if namespace.Name == resources.KAPP_SYSTEM_NAMESPACE {
		return &ResMessage{}, nil
	}

	if _, exist := namespace.Labels[controllers.KalmEnableLabelName]; !exist {
		return &ResMessage{}, nil
	}

	builder := resources.NewBuilder(c.K8sClientset, c.K8SClientConfig, log.New())
	applicationDetails, err := builder.BuildApplicationDetails(*namespace)
	if err != nil {
		return nil, err
	}

	return &ResMessage{
		Namespace: "",
		Kind:      "Application",
		Action:    action,
		Data:      applicationDetails,
	}, nil
}

func componentToResMessage(c *Client, action string, component *v1alpha1.Component) (*ResMessage, error) {
	builder := resources.NewBuilder(c.K8sClientset, c.K8SClientConfig, log.New())
	componentDetails, err := builder.BuildComponentDetails(component, nil)
	if err != nil {
		return nil, err
	}

	return &ResMessage{
		Namespace: component.Namespace,
		Kind:      "Component",
		Action:    action,
		Data:      componentDetails,
	}, nil
}

func buildComponentResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	component, ok := objWatched.(*v1alpha1.Component)
	if !ok {
		return nil, errors.New("convert watch obj to Component failed")
	}

	return componentToResMessage(c, action, component)
}

func buildServiceResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	service, ok := objWatched.(*coreV1.Service)
	if !ok {
		return nil, errors.New("convert watch obj to Service failed")
	}

	componentName := service.Labels["kalm-component"]
	if componentName == "" {
		return &ResMessage{}, nil
	}

	component, err := handler.GetComponent(c.K8sClientset, service.Namespace, componentName)
	if err != nil {
		return nil, err
	}

	return componentToResMessage(c, "Update", component)
}

func buildPodResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	pod, ok := objWatched.(*coreV1.Pod)
	if !ok {
		return nil, errors.New("convert watch obj to Pod failed")
	}

	componentName := pod.Labels["kalm-component"]
	if componentName == "" {
		return &ResMessage{}, nil
	}

	component, err := handler.GetComponent(c.K8sClientset, pod.Namespace, componentName)
	if err != nil {
		return nil, err
	}

	return componentToResMessage(c, "Update", component)
}

func buildHttpRouteResMessage(_ *Client, action string, objWatched interface{}) (*ResMessage, error) {
	route, ok := objWatched.(*v1alpha1.HttpRoute)

	if !ok {
		return nil, errors.New("convert watch obj to Node failed")
	}

	return &ResMessage{
		Kind:      "HttpRoute",
		Namespace: route.Namespace,
		Action:    action,
		Data:      resources.BuildHttpRouteFromResource(route),
	}, nil
}

func buildNodeResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	node, ok := objWatched.(*coreV1.Node)

	if !ok {
		return nil, errors.New("convert watch obj to Node failed")
	}

	//builder := resources.NewBuilder(c.K8sClientset, c.K8SClientConfig, log.New())

	return &ResMessage{
		Kind:   "Node",
		Action: action,
		Data:   resources.BuildNodeResponse(c.K8sClientset, node),
	}, nil
}

func buildHttpsCertResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	httpsCert, ok := objWatched.(*v1alpha1.HttpsCert)
	if !ok {
		return nil, errors.New("convert watch obj to HttpsCert failed")
	}

	return &ResMessage{
		Kind:   "HttpsCert",
		Action: action,
		Data:   resources.BuildHttpsCertResponse(*httpsCert),
	}, nil
}

func buildRegistryResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	registry, ok := objWatched.(*v1alpha1.DockerRegistry)
	if !ok {
		return nil, errors.New("convert watch obj to Registry failed")
	}

	builder := resources.NewBuilder(c.K8sClientset, c.K8SClientConfig, log.New())
	registryRes, err := builder.GetDockerRegistry(registry.Name)
	if err != nil {
		return nil, err
	}

	return &ResMessage{
		Kind:   "Registry",
		Action: action,
		Data:   registryRes,
	}, nil
}

func buildVolumeResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	pvc, ok := objWatched.(*coreV1.PersistentVolumeClaim)
	if !ok {
		return nil, errors.New("convert watch obj to PersistentVolume failed")
	}

	builder := resources.NewBuilder(c.K8sClientset, c.K8SClientConfig, log.New())

	var pv coreV1.PersistentVolume
	if action == "Delete" {
		pv = coreV1.PersistentVolume{}
	} else {
		if err := builder.Get("", pvc.Spec.VolumeName, &pv); err != nil {
			return nil, err
		}
	}

	volume, err := builder.BuildVolumeResponse(*pvc, pv)
	if err != nil {
		return nil, err
	}

	return &ResMessage{
		Kind:   "Volume",
		Action: action,
		Data:   volume,
	}, nil
}
