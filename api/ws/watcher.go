package ws

import (
	"errors"

	"github.com/kapp-staging/kapp/api/handler"
	"github.com/kapp-staging/kapp/api/resources"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	"github.com/kapp-staging/kapp/controller/controllers"
	log "github.com/sirupsen/logrus"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/tools/cache"
	runtimeCache "sigs.k8s.io/controller-runtime/pkg/cache"
)

func StartWatching(c *Client) {
	informerCache, err := runtimeCache.New(c.K8SClientConfig, runtimeCache.Options{})
	if err != nil {
		panic(err)
	}

	registerWatchHandler(c, &informerCache, &coreV1.Namespace{}, buildNamespaceResMessage)
	registerWatchHandler(c, &informerCache, &v1alpha1.Component{}, buildComponentResMessage)
	registerWatchHandler(c, &informerCache, &coreV1.Service{}, buildServiceResMessage)
	registerWatchHandler(c, &informerCache, &coreV1.Pod{}, buildPodResMessage)
	registerWatchHandler(c, &informerCache, &v1alpha1.HttpRoute{}, buildHttpRouteResMessage)
	registerWatchHandler(c, &informerCache, &coreV1.Node{}, buildNodeResMessage)

	// stop := make(chan struct{})
	// defer close(stop)
	informerCache.Start(c.StopWatcher)
}

func registerWatchHandler(c *Client,
	informerCache *runtimeCache.Cache,
	runtimeObj runtime.Object,
	buildResMessage func(c *Client, action string, obj interface{}) (*ResMessage, error)) {

	informer, err := (*informerCache).GetInformer(runtimeObj)
	if err != nil {
		panic(err)
	}

	informer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc: func(obj interface{}) {
			resMessage, err := buildResMessage(c, "Add", obj)
			if err != nil {
				log.Info(err)
				return
			}
			c.sendResMessage(resMessage)
		},
		DeleteFunc: func(obj interface{}) {
			resMessage, err := buildResMessage(c, "Delete", obj)
			if err != nil {
				log.Info(err)
				return
			}
			c.sendResMessage(resMessage)
		},
		UpdateFunc: func(oldObj, obj interface{}) {
			resMessage, err := buildResMessage(c, "Update", obj)
			if err != nil {
				log.Info(err)
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

	if _, exist := namespace.Labels[controllers.KappEnableLabelName]; !exist {
		return nil, errors.New("Namespace " + namespace.Name + " has no kapp-enabled label")
	}

	builder := resources.NewBuilder(c.K8sClientset, c.K8SClientConfig, log.New())
	applicationDetails, err := builder.BuildApplicationDetails(*namespace)
	if err != nil {
		log.Error(err)
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

	componentName := service.Labels["kapp-component"]
	if componentName == "" {
		return nil, errors.New("Service " + service.Name + " has no kapp-component label")
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

	componentName := pod.Labels["kapp-component"]
	if componentName == "" {
		return nil, errors.New("Pod " + pod.Name + " has no kapp-component label")
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

func buildNodeResMessage(_ *Client, action string, objWatched interface{}) (*ResMessage, error) {
	node, ok := objWatched.(*coreV1.Node)

	if !ok {
		return nil, errors.New("convert watch obj to Node failed")
	}

	//builder := resources.NewBuilder(c.K8sClientset, c.K8SClientConfig, log.New())

	return &ResMessage{
		Kind:   "Node",
		Action: action,
		Data:   resources.BuildNodeResponse(node),
	}, nil
}
