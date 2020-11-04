package handler

import (
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleListNodes(c echo.Context) error {
	h.MustCanViewCluster(getCurrentUser(c))

	res, err := h.resourceManager.ListNodes()

	if err != nil {
		return err
	}

	return c.JSON(200, res)
}

func (h *ApiHandler) handleCordonNode(c echo.Context) error {
	h.MustCanEditCluster(getCurrentUser(c))

	node, err := h.resourceManager.GetNode(c.Param("name"))

	if err != nil {
		return err
	}

	if err := h.resourceManager.CordonNode(node); err != nil {
		return err
	}

	return c.JSON(200, h.resourceManager.BuildNodeResponse(node))
}

func (h *ApiHandler) handleUncordonNode(c echo.Context) error {
	h.MustCanEditCluster(getCurrentUser(c))

	node, err := h.resourceManager.GetNode(c.Param("name"))

	if err != nil {
		return err
	}

	if err := h.resourceManager.UncordonNode(node); err != nil {
		return err
	}

	return c.JSON(200, h.resourceManager.BuildNodeResponse(node))
}
