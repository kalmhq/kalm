package handler

import (
	"github.com/kapp-staging/kapp/api/auth"
	"github.com/labstack/echo/v4"
	"k8s.io/client-go/kubernetes"
	"net/http"
)

func (h *ApiHandler) handleLogin(c echo.Context) error {
	authInfo, err := auth.GetAuthInfo(c)
	if err != nil {
		return err
	}
	err = h.clientManager.IsAuthInfoWorking(authInfo)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, H{"authorized": true})
}

func (h *ApiHandler) handleLoginStatus(c echo.Context) error {
	clientConfig, err := h.clientManager.GetClientConfig(c)

	if err != nil {
		return c.JSON(200, H{
			"authorized": false,
		})
	}

	k8sClient, err := kubernetes.NewForConfig(clientConfig)
	if err != nil {
		return c.JSON(200, H{
			"authorized": false,
		})
	}

	_, err = k8sClient.ServerVersion()

	return c.JSON(200, H{
		"authorized": err == nil,
	})
}
