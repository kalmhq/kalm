package handler

import (
	"github.com/kapp-staging/kapp/api/resources"
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleListNodes(c echo.Context) error {
	res, err := resources.ListNodes(getK8sClient(c))

	if err != nil {
		return err
	}

	return c.JSON(200, res)
}
