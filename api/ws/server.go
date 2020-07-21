package ws

import (
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/kalmhq/kalm/api/client"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
)

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
)

type WsHandler struct {
	k8sClientManager *client.ClientManager
	clientPool       *ClientPool
}

func NewWsHandler(k8sClientManager *client.ClientManager) *WsHandler {
	clientPool := NewClientPool()
	go clientPool.run()

	return &WsHandler{
		k8sClientManager: k8sClientManager,
		clientPool:       clientPool,
	}
}

func (h *WsHandler) Serve(c echo.Context) error {
	conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		log.Error(err)
		return err
	}

	client := &Client{
		clientPool:       h.clientPool,
		conn:             conn,
		Send:             make(chan []byte, 256),
		Done:             make(chan struct{}),
		StopWatcher:      make(chan struct{}),
		K8sClientManager: h.k8sClientManager,
	}
	client.clientPool.register <- client

	go client.write()
	client.read()

	return nil
}
