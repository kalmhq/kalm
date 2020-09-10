package ws

import (
	"encoding/json"
	"github.com/go-logr/logr"
	"github.com/gorilla/websocket"
	"github.com/kalmhq/kalm/api/client"
	"github.com/kalmhq/kalm/api/log"
	"github.com/kalmhq/kalm/api/resources"
)

type ReqMessage struct {
	Method        string `json:"method"`
	Token         string `json:"token"`
	Impersonation string `json:"impersonation"`
}

type ResMessage struct {
	Namespace string      `json:"namespace"`
	Kind      string      `json:"kind"`
	Action    string      `json:"action"` // Add Delete Update
	Data      interface{} `json:"data"`
}

type Client struct {
	clientPool    *ClientPool
	conn          *websocket.Conn
	send          chan []byte
	done          chan struct{}
	stopWatcher   chan struct{}
	clientManager client.ClientManager
	clientInfo    *client.ClientInfo
	logger        logr.Logger
	isWatching    bool
}

type ClientPool struct {
	clients    map[*Client]bool
	register   chan *Client
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
		case c := <-h.register:
			h.clients[c] = true
		case c := <-h.unregister:
			if _, ok := h.clients[c]; ok {
				delete(h.clients, c)
				c.send = nil
			}
		}
	}
}

func (c *Client) read() {
	defer func() {
		c.clientPool.unregister <- c
		close(c.stopWatcher)
		close(c.done)
		c.conn.Close()
	}()

	for {
		_, messageBytes, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure, websocket.CloseNoStatusReceived) {
				return
			}

			log.Error(err, "read message error")
			return
		}

		var reqMessage ReqMessage
		_ = json.Unmarshal(messageBytes, &reqMessage)

		if c.clientInfo == nil {
			clientInfo, err := c.clientManager.GetClientInfoFromToken(reqMessage.Token, reqMessage.Impersonation)

			if err != nil {
				log.Error(err, "new config error")
			}

			c.clientInfo = clientInfo
		}

		if reqMessage.Method == "StartWatching" && !c.isWatching {
			c.isWatching = true
			c.sendWatchResMessage(&ResMessage{Kind: "PlainMessage", Data: "Started"})
			go StartWatching(c)
		}

	}
}
func (c *Client) Builder() *resources.ResourceManager {
	return resources.NewResourceManager(c.clientInfo.Cfg, c.logger)
}

func (c *Client) write() {
	defer func() {
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				break
			}

			err := c.conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				log.Error(err, "write message error")
				break
			}
			continue
		case <-c.done:
			return
		}
	}
}

func (c *Client) sendWatchResMessage(resMessage *ResMessage) {
	if resMessage.Action == "" {
		return
	}

	bts, err := json.Marshal(resMessage)
	if err != nil {
		log.Error(err, "parse message error")
		return
	}

	c.send <- bts
}
