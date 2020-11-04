package handler

import (
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleListClusterServices(c echo.Context) error {
	namespace := c.Param("namespace")
	currentUser := getCurrentUser(c)

	if namespace != "" {
		h.MustCanView(currentUser, currentUser.Tenant+"/"+namespace, "services/*")
	} else {
		h.MustCanView(currentUser, currentUser.Tenant+"/*", "services/*")
	}

	list, err := h.resourceManager.GetServices(namespace)

	if err != nil {
		return err
	}

	return c.JSON(200, list)
}
