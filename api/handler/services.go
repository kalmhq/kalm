package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleListClusterServices(c echo.Context) error {
	namespace := c.Param("namespace")
	builder := h.Builder(c)

	if namespace != "" {
		if !builder.CanViewNamespace(namespace) {
			return resources.NoNamespaceViewerRoleError(namespace)
		}
	} else {
		if !builder.CanViewCluster() {
			return resources.NoClusterViewerRoleError
		}
	}

	list, err := builder.GetServices(namespace)

	if err != nil {
		return err
	}

	return c.JSON(200, list)
}
