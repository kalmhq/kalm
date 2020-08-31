package ws

import (
	"github.com/go-logr/logr"
	"github.com/gorilla/websocket"
	"github.com/kalmhq/kalm/api/client"
	"github.com/kalmhq/kalm/api/log"
	rbac2 "github.com/kalmhq/kalm/api/rbac"
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
	k8sClientManager client.ClientManager
	rbacEnforcer     rbac2.Enforcer
	clientPool       *ClientPool
	logger           logr.Logger
}

func NewWsHandler(k8sClientManager client.ClientManager, enforcer rbac2.Enforcer) *WsHandler {
	clientPool := NewClientPool()
	go clientPool.run()

	return &WsHandler{
		k8sClientManager: k8sClientManager,
		clientPool:       clientPool,
		rbacEnforcer:     enforcer,
		logger:           log.DefaultLogger(),
	}
}

func (h *WsHandler) Serve(c echo.Context) error {
	clt := &Client{
		clientPool:       h.clientPool,
		Send:             make(chan []byte, 256),
		Done:             make(chan struct{}),
		StopWatcher:      make(chan struct{}),
		K8sClientManager: h.k8sClientManager,
		RBACEnforcer:     h.rbacEnforcer,
		logger:           h.logger,
	}

	conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)

	if err != nil {
		log.Error(err, "ws upgrade error")
		return err
	}

	clt.conn = conn

	clientInfo, err := h.k8sClientManager.GetConfigForClientRequestContext(c)

	if err == nil {
		clt.ClientInfo = clientInfo
	}

	clt.clientPool.register <- clt

	go clt.write()
	clt.read()

	return nil
}
