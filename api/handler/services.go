package handler

import (
	"github.com/labstack/echo/v4"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (h *ApiHandler) handleListClusterServices(c echo.Context) error {
	namespace := c.Param("namespace")
	currentUser := getCurrentUser(c)

	if namespace != "" {
		h.MustCanView(currentUser, namespace, "services/*")
	} else {
		h.MustCanView(currentUser, "*", "services/*")
	}

	list, err := h.resourceManager.GetServices(client.InNamespace(namespace))

	if err != nil {
		return err
	}

	return c.JSON(200, list)
}
