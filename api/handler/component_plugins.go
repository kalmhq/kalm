package handler

import (
	"github.com/kapp-staging/kapp/api/resources"
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleListComponentPlugins(c echo.Context) error {
	plugins, err := h.listComponentPluginsResponse(c)

	if err != nil {
		return err
	}

	return c.JSON(200, plugins)
}

func (h *ApiHandler) listComponentPluginsResponse(c echo.Context) ([]resources.ComponentPlugin, error) {
	k8sClient := getK8sClient(c)
	k8sClientConfig := getK8sClientConfig(c)

	builder := resources.Builder{
		K8sClient: k8sClient,
		Logger:    h.logger,
		Config:    k8sClientConfig,
	}

	return builder.GetComponentPlugins()
}
