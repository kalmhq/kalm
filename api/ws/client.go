package ws

import (
	"encoding/json"

	"github.com/gorilla/websocket"
	"github.com/kapp-staging/kapp/api/client"
	log "github.com/sirupsen/logrus"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd/api"
)

type MessageData struct {
	Token  string `json:"token"`
	Method string `json:"method"`
}

type Client struct {
	clientPool *ClientPool

	conn *websocket.Conn

	Send chan []byte

	K8sClientManager *client.ClientManager

	K8sClientset *kubernetes.Clientset
}

type ClientPool struct {
	clients map[*Client]bool

	register chan *Client

	unregister chan *Client
}

func NewClientPool() *ClientPool {
	return &ClientPool{
		clients:    make(map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (c *Client) read() {
	defer func() {
		c.clientPool.unregister <- c
		c.conn.Close()
	}()

	for {
		_, messageBytes, err := c.conn.ReadMessage()
		if err != nil {
			log.Error(err)
		}
		log.Info(messageBytes)
		var messageData MessageData
		_ = json.Unmarshal(messageBytes, &messageData)

		if c.K8sClientset == nil {
			authInfo := &api.AuthInfo{Token: messageData.Token}
			k8sClientConfig, err := c.K8sClientManager.GetClientConfigWithAuthInfo(authInfo)
			if err != nil {
				log.Error(err)
			}

			k8sClientset, err := kubernetes.NewForConfig(k8sClientConfig)
			if err != nil {
				log.Error(err)
			}

			c.K8sClientset = k8sClientset
		}

		// TODO more metheds
		if messageData.Method == "ServiceList" {
			StartWatching(c)
		}

	}
}

func (c *Client) write() {
	defer func() {
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			c.conn.WriteMessage(websocket.TextMessage, message)
		}
	}
}
