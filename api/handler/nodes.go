package handler

import (
	"github.com/kalm-staging/kalm/api/resources"
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleListNodes(c echo.Context) error {
	res, err := resources.ListNodes(getK8sClient(c))

	if err != nil {
		return err
	}

	return c.JSON(200, res)
}

func (h *ApiHandler) handleCordonNode(c echo.Context) error {
	builder := h.Builder(c)
	node, err := builder.GetNode(c.Param("name"))

	if err != nil {
		return err
	}

	if err := builder.CordonNode(node); err != nil {
		return err
	}

	return c.JSON(200, resources.BuildNodeResponse(getK8sClient(c), node))
}

func (h *ApiHandler) handleUncordonNode(c echo.Context) error {
	builder := h.Builder(c)
	node, err := builder.GetNode(c.Param("name"))

	if err != nil {
		return err
	}

	if err := builder.UncordonNode(node); err != nil {
		return err
	}

	return c.JSON(200, resources.BuildNodeResponse(getK8sClient(c), node))
}
