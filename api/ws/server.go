package ws

import (
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/kalmhq/kalm/api/client"
	"github.com/kalmhq/kalm/api/log"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
)

type WsHandler struct {
	clientManager client.ClientManager
	clientPool    *ClientPool
	logger        *zap.Logger
	isLocalMode   bool
}

func NewWsHandler(clientManager client.ClientManager, isLocalMode bool) *WsHandler {
	clientPool := NewClientPool()
	go clientPool.run()

	return &WsHandler{
		clientManager: clientManager,
		clientPool:    clientPool,
		logger:        log.DefaultLogger(),
		isLocalMode:   isLocalMode,
	}
}

func (h *WsHandler) Serve(c echo.Context) error {
	clt := &Client{
		clientPool:    h.clientPool,
		send:          make(chan []byte, 256),
		done:          make(chan struct{}),
		stopWatcher:   make(chan struct{}),
		clientManager: h.clientManager,
		logger:        h.logger,
	}

	conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)

	if err != nil {
		log.Error("ws upgrade error", zap.Error(err))
		return err
	}

	clt.conn = conn

	clientInfo, err := h.clientManager.GetClientInfoFromContext(c)
	if err == nil && clientInfo != nil {
		if h.isLocalMode {
			if clientInfo.Tenant == "" {
				clientInfo.Tenant = v1alpha1.DefaultGlobalTenantName
			}
			if len(clientInfo.Tenants) == 0 {
				clientInfo.Tenants = []string{v1alpha1.DefaultGlobalTenantName}
			}
		}

		clt.clientInfo = clientInfo
	}

	clt.clientPool.register <- clt

	go clt.write()
	clt.read()

	return nil
}
