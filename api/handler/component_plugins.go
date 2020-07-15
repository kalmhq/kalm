package handler

import (
	"github.com/kalmhq/kalm/api/resources"
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
	builder := resources.NewBuilder(k8sClient, k8sClientConfig, h.logger)
	return builder.GetComponentPlugins()
}
