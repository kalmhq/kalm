package handler

import (
	"github.com/kapp-staging/kapp/api/resources"
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleListApplicationPlugins(c echo.Context) error {
	plugins, err := h.listApplicationPluginsResponse(c)

	if err != nil {
		return err
	}

	return c.JSON(200, plugins)
}

func (h *ApiHandler) listApplicationPluginsResponse(c echo.Context) ([]resources.ApplicationPlugin, error) {
	k8sClient := getK8sClient(c)
	k8sClientConfig := getK8sClientConfig(c)
	builder := resources.NewBuilder(k8sClient, k8sClientConfig, h.logger)
	return builder.GetApplicationPlugins()
}
