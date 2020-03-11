package handler

import (
	"github.com/kapp-staging/kapp/api/auth"
	"github.com/kapp-staging/kapp/api/client"
	"github.com/labstack/echo/v4"
	"net/http"
)

type ApiHandler struct {
	clientManager *client.ClientManager
}

type H map[string]interface{}

func (h *ApiHandler) Install(e *echo.Echo) {
	e.POST("/login", h.handlerLogin)
	//e.GET("/login/status", handleLoginStatus)
}

func (h *ApiHandler) handlerLogin(c echo.Context) error {
	var loginData auth.LoginData
	if err := c.Bind(&loginData); err != nil {
		return err
	}

	authInfo, err := loginData.GetAuthInfo()
	if err != nil {
		return err
	}

	err = h.clientManager.IsAuthInfoWorking(authInfo)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, H{"ok": true})
}

func NewApiHandler(clientManager *client.ClientManager) *ApiHandler {
	return &ApiHandler{
		clientManager: clientManager,
	}
}
