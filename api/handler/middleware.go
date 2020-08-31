package handler

import (
	"github.com/kalmhq/kalm/api/client"
	"github.com/labstack/echo/v4"
	"k8s.io/client-go/kubernetes"
)

const (
	KUBERNETES_CLIENT_INFO_KEY   = "k8sClientConfig"
	KUBERNETES_CLIENT_CLIENT_KEY = "k8sClient"
)

func (h *ApiHandler) AuthClientMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		clientInfo, err := h.clientManager.GetConfigForClientRequestContext(c)

		if err != nil {
			return err
		}

		c.Set(KUBERNETES_CLIENT_INFO_KEY, clientInfo)

		k8sClient, err := kubernetes.NewForConfig(clientInfo.Cfg)
		if err != nil {
			return err
		}

		c.Set(KUBERNETES_CLIENT_CLIENT_KEY, k8sClient)

		return next(c)
	}
}

func getK8sClient(c echo.Context) *kubernetes.Clientset {
	return c.Get(KUBERNETES_CLIENT_CLIENT_KEY).(*kubernetes.Clientset)
}

func getK8sClientInfo(c echo.Context) *client.ClientInfo {
	return c.Get(KUBERNETES_CLIENT_INFO_KEY).(*client.ClientInfo)
}
