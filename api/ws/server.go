package ws

import (
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/kapp-staging/kapp/api/client"
	"github.com/labstack/echo/v4"
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
		return err
	}

	client := &Client{
		clientPool:       h.clientPool,
		conn:             conn,
		Send:             make(chan []byte, 128),
		K8sClientManager: h.k8sClientManager,
	}
	client.clientPool.register <- client

	go client.read()
	go client.write()

	return nil

	// defer conn.Close()

	// for {
	// 	err := conn.WriteMessage(websocket.TextMessage, []byte("Hello, Client 1!"))
	// 	if err != nil {
	// 		c.Logger().Error(err)
	// 	}

	// 	// Read
	// 	_, msg, err := conn.ReadMessage()
	// 	if err != nil {
	// 		c.Logger().Error(err)
	// 	}
	// 	fmt.Printf("%s\n", msg)

	// 	// Write
	// 	err = conn.WriteMessage(websocket.TextMessage, []byte("Hello, Client 2!"))
	// 	if err != nil {
	// 		c.Logger().Error(err)
	// 	}
	// }
}
