package handler

import (
	"github.com/kapp-staging/kapp/api/auth"
	"github.com/kapp-staging/kapp/api/client"
	"github.com/labstack/echo/v4"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/fields"
	"k8s.io/apimachinery/pkg/labels"
	"net/http"
)

type ApiHandler struct {
	clientManager *client.ClientManager
}

type H map[string]interface{}

func (h *ApiHandler) Install(e *echo.Echo) {
	e.POST("/login", h.handlerLogin)
	//e.GET("/login/status", handleLoginStatus)
	e.GET("/deployments", h.handleGetDeployments)
}

func (h *ApiHandler) handlerLogin(c echo.Context) error {
	authInfo, err := auth.GetAuthInfo(c)
	if err != nil {
		return err
	}

	err = h.clientManager.IsAuthInfoWorking(authInfo)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, H{"ok": true})
}

func (h *ApiHandler) handleGetDeployments(c echo.Context) error {
	k8sClient, err := h.clientManager.GetClient(c)

	if err != nil {
		return err
	}

	list, err := k8sClient.AppsV1().Deployments("").List(v1.ListOptions{
		LabelSelector: labels.Everything().String(),
		FieldSelector: fields.Everything().String(),
	})

	if err != nil {
		return err
	}

	return c.JSON(200, list)
}

func NewApiHandler(clientManager *client.ClientManager) *ApiHandler {
	return &ApiHandler{
		clientManager: clientManager,
	}
}
