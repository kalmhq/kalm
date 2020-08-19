package handler

import (
	"github.com/labstack/echo/v4"
	coreV1 "k8s.io/api/core/v1"
)

func (h *ApiHandler) handleGetPVs(c echo.Context) error {
	var pvList coreV1.PersistentVolumeList
	err := h.Builder(c).List(&pvList)
	if err != nil {
		return err
	}
	return c.JSON(200, pvList)
}
