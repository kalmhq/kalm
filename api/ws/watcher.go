package ws

import (
	"encoding/json"
	"fmt"
	"time"

	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/fields"
	"k8s.io/client-go/tools/cache"
)

func StartWatching(c *Client) {
	watchlist := cache.NewListWatchFromClient(
		c.K8sClientset.CoreV1().RESTClient(),
		string(v1.ResourceServices),
		v1.NamespaceAll,
		fields.Everything(),
	)
	_, controller := cache.NewInformer( // also take a look at NewSharedIndexInformer
		watchlist,
		&v1.Service{},
		0, //Duration is int64
		cache.ResourceEventHandlerFuncs{
			AddFunc: func(obj interface{}) {
				fmt.Printf("service added: %s \n", obj)

				bts, err := json.Marshal(obj)
				if err != nil {
					panic(err)
				}

				// TODO TYPE ADD DELETE MODIFY
				c.Send <- bts
			},
			DeleteFunc: func(obj interface{}) {
				fmt.Printf("service deleted: %s \n", obj)
			},
			UpdateFunc: func(oldObj, newObj interface{}) {
				fmt.Printf("service changed \n")
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

// var testToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IiJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJkZWZhdWx0Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6ImthcHAtc2FtcGxlLXVzZXItdG9rZW4teno0dGoiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoia2FwcC1zYW1wbGUtdXNlciIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VydmljZS1hY2NvdW50LnVpZCI6Ijc5ZDNkNDEwLTc1OGUtNGNkMS1hOGU5LWI2OGMxYWJkYzg2YyIsInN1YiI6InN5c3RlbTpzZXJ2aWNlYWNjb3VudDpkZWZhdWx0OmthcHAtc2FtcGxlLXVzZXIifQ.aO2wsO4PcqtWBdT10Ythf0ExAqWMgqS_YsxTMF6DVzInXkJEtzVVXUiIfYwV21fPzaiAr4-R2FoTpAkuz4BTSZXTdiO89VrbebS6rNiVe73HVC7njA23PgEHWVdtOWezc6U3Hm9FhTqdVzujf2FhAG71zGUVdt-hGZu77v9KMctxcr1Y6xVaL2H79rR6V8z2xJxlCdPST1Q11uVvrjL2msts6mIrf61PNOaGwkd5qBtqTSTOFMrehL2JjZAeZxtZZKBZlZhJUPZIEU2DQNcwjVo_RPmdB1jyzBFRueE2LYiz8vpqCq8CgtDdcDHfGLIWdgS6CfjCmti5peBRTTXdHg"

// func StartWatching(clientManager *client.ClientManager) {
// 	authInfo := &api.AuthInfo{Token: testToken}
// 	config, err := clientManager.GetClientConfigWithAuthInfo(authInfo)

// 	if err != nil {
// 		log.Errorln(err)
// 	}

// 	clientset, err := kubernetes.NewForConfig(config)
// 	if err != nil {
// 		log.Errorln(err)
// 	}

// 	watchlist := cache.NewListWatchFromClient(
// 		clientset.CoreV1().RESTClient(),
// 		string(v1.ResourceServices),
// 		v1.NamespaceAll,
// 		fields.Everything(),
// 	)
// 	_, controller := cache.NewInformer( // also take a look at NewSharedIndexInformer
// 		watchlist,
// 		&v1.Service{},
// 		0, //Duration is int64
// 		cache.ResourceEventHandlerFuncs{
// 			AddFunc: func(obj interface{}) {
// 				fmt.Printf("service added: %s \n", obj)
// 			},
// 			DeleteFunc: func(obj interface{}) {
// 				fmt.Printf("service deleted: %s \n", obj)
// 			},
// 			UpdateFunc: func(oldObj, newObj interface{}) {
// 				fmt.Printf("service changed \n")
// 			},
// 		},
// 	)
// 	// serviceInformer :=
// 	// 	cache.NewSharedIndexInformer(watchlist,
// 	// 		&v1.Service{}, 0, cache.Indexers{
// 	// 			cache.NamespaceIndex: cache.MetaNamespaceIndexFunc,
// 	// 		})
// 	// go serviceInformer.Run(stop)
// 	stop := make(chan struct{})
// 	defer close(stop)
// 	go controller.Run(stop)
// 	for {
// 		time.Sleep(time.Second)
// 	}
// }
