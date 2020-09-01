package handler

import (
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleListComponentPlugins(c echo.Context) error {
	plugins, err := h.resourceManager.GetComponentPlugins()

	if err != nil {
		return err
	}

	return c.JSON(200, plugins)
}
