package ws

import (
	"github.com/go-logr/logr"
	"github.com/gorilla/websocket"
	"github.com/kalmhq/kalm/api/client"
	"github.com/kalmhq/kalm/api/log"
	"github.com/labstack/echo/v4"
	"net/http"
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
	logger           logr.Logger
}

func NewWsHandler(k8sClientManager *client.ClientManager) *WsHandler {
	clientPool := NewClientPool()
	go clientPool.run()

	return &WsHandler{
		k8sClientManager: k8sClientManager,
		clientPool:       clientPool,
		logger:           log.DefaultLogger(),
	}
}

func (h *WsHandler) Serve(c echo.Context) error {
	conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		log.Error(err, "ws upgrade error")
		return err
	}

	client := &Client{
		clientPool:       h.clientPool,
		conn:             conn,
		Send:             make(chan []byte, 256),
		Done:             make(chan struct{}),
		StopWatcher:      make(chan struct{}),
		K8sClientManager: h.k8sClientManager,
		logger:           h.logger,
	}
	client.clientPool.register <- client

	go client.write()
	client.read()

	return nil
}
