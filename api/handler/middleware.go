package handler

import (
	"github.com/kalmhq/kalm/api/client"
	"github.com/labstack/echo/v4"
)

const (
	CURRENT_USER_KEY = "k8sClientConfig"
)

func (h *ApiHandler) AuthClientMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		clientInfo, err := h.clientManager.GetConfigForClientRequestContext(c)
		if err != nil {
			return err
		}
		c.Set(CURRENT_USER_KEY, clientInfo)
		return next(c)
	}
}

func getCurrentUser(c echo.Context) *client.ClientInfo {
	return c.Get(CURRENT_USER_KEY).(*client.ClientInfo)
}
