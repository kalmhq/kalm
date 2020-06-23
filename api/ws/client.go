package ws

import (
	"encoding/json"

	"github.com/gorilla/websocket"
	"github.com/kapp-staging/kapp/api/client"
	log "github.com/sirupsen/logrus"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd/api"
)

type ReqMessage struct {
	Method string `json:"method"`
	Token  string `json:"token"`
}

type ResMessage struct {
	Namespace string      `json:"namespace"`
	Component string      `json:"component"` // for pods services... kapp-component Label
	Kind      string      `json:"kind"`
	Action    string      `json:"action"`
	Data      interface{} `json:"data"`
}

type Client struct {
	clientPool *ClientPool

	conn *websocket.Conn

	Send chan []byte

	K8sClientManager *client.ClientManager

	K8SClientConfig *rest.Config

	K8sClientset *kubernetes.Clientset

	IsWatching bool
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

func (h *ClientPool) run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
			}
		}
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

		var reqMessage ReqMessage
		_ = json.Unmarshal(messageBytes, &reqMessage)
		log.Info("-------------reqMessage")
		log.Info(reqMessage)

		if c.K8SClientConfig == nil {
			authInfo := &api.AuthInfo{Token: reqMessage.Token}
			k8sClientConfig, err := c.K8sClientManager.GetClientConfigWithAuthInfo(authInfo)
			if err != nil {
				log.Error(err)
			}
			c.K8SClientConfig = k8sClientConfig

			k8sClientset, err := kubernetes.NewForConfig(k8sClientConfig)
			if err != nil {
				log.Error(err)
			}
			c.K8sClientset = k8sClientset
		}

		if reqMessage.Method == "StartWatching" && !c.IsWatching {
			c.IsWatching = true
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
				break
			}

			c.conn.WriteMessage(websocket.TextMessage, message)
		}
	}
}

func (c *Client) sendResMessage(resMessage *ResMessage) {
	if resMessage.Action == "" {
		return
	}

	bts, err := json.Marshal(resMessage)
	if err != nil {
		panic(err)
	}
	c.Send <- bts
}
