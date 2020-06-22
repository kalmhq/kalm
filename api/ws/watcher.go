package ws

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/fields"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/informers"
	"k8s.io/client-go/tools/cache"
)

func StartWatchingComponents(c *Client) {
	// watchlist := cache.NewListWatchFromClient(
	// 	c.K8sClientset.CoreV1().RESTClient(),
	// 	// string(v1.ResourceServices),
	// 	"components",
	// 	v1.NamespaceAll,
	// 	fields.Everything(),
	// )

	optionsModifier := func(options *metav1.ListOptions) {
		options.FieldSelector = fields.Everything().String()
	}

	const namespace = "kapp-hello-world"

	listFunc := func(options metav1.ListOptions) (runtime.Object, error) {
		optionsModifier(&options)
		return c.K8sClientset.RESTClient().Get().
			AbsPath("/apis/core.kapp.dev/v1alpha1/namespaces/" + namespace + "/components").
			Do().
			Get()
	}
	watchFunc := func(options metav1.ListOptions) (watch.Interface, error) {
		options.Watch = true
		optionsModifier(&options)
		return c.K8sClientset.RESTClient().Get().
			AbsPath("/apis/core.kapp.dev/v1alpha1/namespaces/"+namespace+"/components").
			VersionedParams(&options, metav1.ParameterCodec).
			Watch()
	}
	watchlist := &cache.ListWatch{ListFunc: listFunc, WatchFunc: watchFunc}

	_, controller := cache.NewInformer( // also take a look at NewSharedIndexInformer
		watchlist,
		// &v1.Service{},
		&v1alpha1.Component{},
		0, //Duration is int64
		cache.ResourceEventHandlerFuncs{
			AddFunc: func(obj interface{}) {
				fmt.Printf("component added: %s \n", obj)

				bts, err := json.Marshal(obj)
				if err != nil {
					panic(err)
				}

				// TODO TYPE ADD DELETE MODIFY
				c.Send <- bts
			},
			DeleteFunc: func(obj interface{}) {
				fmt.Printf("component deleted: %s \n", obj)
			},
			UpdateFunc: func(oldObj, newObj interface{}) {
				fmt.Printf("component changed \n")
			},
		},
	)

	stop := make(chan struct{})
	defer close(stop)
	go controller.Run(stop)
	for {
		time.Sleep(time.Second)
	}
}

func StartWatchingServices2(c *Client) {
	kubeInformerFactory := informers.NewSharedInformerFactory(c.K8sClientset, time.Second*30)
	svcInformer := kubeInformerFactory.Core().V1().Services().Informer()

	svcInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc: func(obj interface{}) {
			fmt.Printf("component added: %s \n", obj)
			bts, err := json.Marshal(obj)
			if err != nil {
				panic(err)
			}
			// TODO TYPE ADD DELETE MODIFY
			c.Send <- bts
		},
		DeleteFunc: func(obj interface{}) {
			fmt.Printf("component deleted: %s \n", obj)
		},
		UpdateFunc: func(oldObj, newObj interface{}) {
			fmt.Printf("component changed: %s \n", newObj)
		},
	})

	stop := make(chan struct{})
	defer close(stop)
	kubeInformerFactory.Start(stop)
	for {
		time.Sleep(time.Second)
	}
}

func StartWatchingServices(c *Client) {
	watchlist := cache.NewListWatchFromClient(
		c.K8sClientset.CoreV1().RESTClient(),
		string(v1.ResourceServices),
		// "components",
		v1.NamespaceAll,
		fields.Everything(),
	)

	_, controller := cache.NewInformer( // also take a look at NewSharedIndexInformer
		watchlist,
		&v1.Service{},
		// &v1alpha1.Component{},
		0, //Duration is int64
		cache.ResourceEventHandlerFuncs{
			AddFunc: func(obj interface{}) {
				fmt.Printf("component added: %s \n", obj)

				bts, err := json.Marshal(obj)
				if err != nil {
					panic(err)
				}

				// TODO TYPE ADD DELETE MODIFY
				c.Send <- bts
			},
			DeleteFunc: func(obj interface{}) {
				fmt.Printf("component deleted: %s \n", obj)
			},
			UpdateFunc: func(oldObj, newObj interface{}) {
				fmt.Printf("component changed \n")
			},
		},
	)

	stop := make(chan struct{})
	defer close(stop)
	go controller.Run(stop)
	for {
		time.Sleep(time.Second)
	}
}
