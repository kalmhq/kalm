package handler

import "github.com/labstack/echo/v4"

func (h *ApiHandler) handleListClusterServices(c echo.Context) error {
	list, err := h.Builder(c).GetServices(c.Param("namespace"))
	if err != nil {
		return err
	}
	return c.JSON(200, list)
}
