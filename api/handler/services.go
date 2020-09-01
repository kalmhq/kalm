package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleListClusterServices(c echo.Context) error {
	namespace := c.Param("namespace")

	if namespace != "" {
		if !h.clientManager.CanViewNamespace(getCurrentUser(c), namespace) {
			return resources.NoNamespaceViewerRoleError(namespace)
		}
	} else {
		if !h.clientManager.CanViewCluster(getCurrentUser(c)) {
			return resources.NoClusterViewerRoleError
		}
	}

	list, err := h.builder.GetServices(namespace)

	if err != nil {
		return err
	}

	return c.JSON(200, list)
}
