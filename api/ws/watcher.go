package ws

import (
	"encoding/json"
	"fmt"
	"time"

	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/fields"
	"k8s.io/client-go/informers"
	"k8s.io/client-go/tools/cache"
)

func StartWatchingComponents(c *Client) {
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
	// serviceInformer :=
	// 	cache.NewSharedIndexInformer(watchlist,
	// 		&v1.Service{}, 0, cache.Indexers{
	// 			cache.NamespaceIndex: cache.MetaNamespaceIndexFunc,
	// 		})
	// go serviceInformer.Run(stop)
	stop := make(chan struct{})
	defer close(stop)
	go controller.Run(stop)
	for {
		time.Sleep(time.Second)
	}
}
