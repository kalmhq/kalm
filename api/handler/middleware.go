package handler

import (
	"github.com/labstack/echo/v4"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

const (
	KUBERNETES_CLIENT_CONFIG_KEY = "k8sClientConfig"
	KUBERNETES_CLIENT_CLIENT_KEY = "k8sClient"
)

func (h *ApiHandler) AuthClientMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		clientConfig, err := h.clientManager.GetClientConfig(c)

		if err != nil {
			return err
		}

		c.Set(KUBERNETES_CLIENT_CONFIG_KEY, clientConfig)

		k8sClient, err := kubernetes.NewForConfig(clientConfig)
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

func getK8sClientConfig(c echo.Context) *rest.Config {
	return c.Get(KUBERNETES_CLIENT_CONFIG_KEY).(*rest.Config)
}
