package ws

import (
	"github.com/kapp-staging/kapp/api/resources"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	log "github.com/sirupsen/logrus"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/tools/cache"
	runtimeCache "sigs.k8s.io/controller-runtime/pkg/cache"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func StartWatching(c *Client) {
	go WatchComponents(c)
	go WatchServices(c)
	go WatchPods(c)
}

func WatchComponents(c *Client) {
	log.Info("--------------WatchComponents")
	Watch(c, &v1alpha1.Component{}, buildComponentResMessage)
}

func WatchServices(c *Client) {
	log.Info("--------------WatchServices")
	Watch(c, &coreV1.Service{}, buildServiceResMessage)
}

func WatchPods(c *Client) {
	log.Info("--------------WatchPods")
	Watch(c, &coreV1.Pod{}, buildPodResMessage)
}

func Watch(c *Client, runtimeObj runtime.Object, buildResMessage func(c *Client, action string, obj interface{}) *ResMessage) {
	informerCache, err := runtimeCache.New(c.K8SClientConfig, runtimeCache.Options{})
	if err != nil {
		panic(err)
	}

	informer, err := informerCache.GetInformer(runtimeObj)
	if err != nil {
		panic(err)
	}

	informer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc: func(obj interface{}) {
			// log.Infoln("watch added: %s", obj)

			resMessage := buildResMessage(c, "Add", obj)
			c.sendResMessage(resMessage)
		},
		DeleteFunc: func(obj interface{}) {
			// log.Infoln("watch deleted: %s", obj)

			resMessage := buildResMessage(c, "Delete", obj)
			c.sendResMessage(resMessage)
		},
		UpdateFunc: func(oldObj, obj interface{}) {
			// log.Infoln("watch changed: %s", obj)

			resMessage := buildResMessage(c, "Update", obj)
			c.sendResMessage(resMessage)
		},
	})

	stop := make(chan struct{})
	defer close(stop)
	informerCache.Start(stop)
}

func buildComponentResMessage(c *Client, action string, objWatched interface{}) *ResMessage {
	component, ok := objWatched.(*v1alpha1.Component)
	if !ok {
		log.Warnln("convert watch obj to Component failed %s", objWatched)
		return &ResMessage{}
	}

	builder := resources.NewBuilder(c.K8sClientset, c.K8SClientConfig, log.New())
	componentDetails, err := builder.BuildComponentDetails(component, nil)
	if err != nil {
		log.Error(err)
	}

	return &ResMessage{
		Namespace: component.Namespace,
		Component: "",
		Kind:      "Component",
		Action:    action,
		Data:      componentDetails,
	}
}

func buildServiceResMessage(c *Client, action string, objWatched interface{}) *ResMessage {
	service, ok := objWatched.(*coreV1.Service)
	if !ok {
		log.Warnln("convert watch obj to Service failed %s", objWatched)
		return &ResMessage{}
	}

	serviceStatus := &resources.ServiceStatus{
		Name:      service.Name,
		ClusterIP: service.Spec.ClusterIP,
		Ports:     service.Spec.Ports,
	}

	return &ResMessage{
		Namespace: service.Namespace,
		Component: service.Labels["kapp-component"],
		Kind:      "Service",
		Action:    action,
		Data:      serviceStatus,
	}
}

func buildPodResMessage(c *Client, action string, objWatched interface{}) *ResMessage {
	pod, ok := objWatched.(*coreV1.Pod)
	if !ok {
		log.Warnln("convert watch obj to Pod failed %s", objWatched)
		return &ResMessage{}
	}

	builder := resources.NewBuilder(c.K8sClientset, c.K8SClientConfig, log.New())
	var eventList coreV1.EventList
	ns := client.InNamespace(pod.Namespace)
	err := builder.List(&eventList, ns)
	if err != nil {
		log.Error(err)
	}

	podStatus := resources.GetPodStatus(*pod, eventList.Items)
	podMetric := resources.GetPodMetric(pod.Name, pod.Namespace)

	podStatus.Metrics = podMetric.MetricHistories

	return &ResMessage{
		Namespace: pod.Namespace,
		Component: pod.Labels["kapp-component"],
		Kind:      "Pod",
		Action:    action,
		Data:      objWatched,
	}
}
