package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleListNodes(c echo.Context) error {
	if !h.clientManager.CanViewCluster(getCurrentUser(c)) {
		return resources.NoClusterViewerRoleError
	}

	res, err := h.builder.ListNodes()

	if err != nil {
		return err
	}

	return c.JSON(200, res)
}

func (h *ApiHandler) handleCordonNode(c echo.Context) error {
	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.NoClusterEditorRoleError
	}

	node, err := h.builder.GetNode(c.Param("name"))

	if err != nil {
		return err
	}

	if err := h.builder.CordonNode(node); err != nil {
		return err
	}

	return c.JSON(200, h.builder.BuildNodeResponse(node))
}

func (h *ApiHandler) handleUncordonNode(c echo.Context) error {
	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.NoClusterEditorRoleError
	}

	node, err := h.builder.GetNode(c.Param("name"))

	if err != nil {
		return err
	}

	if err := h.builder.UncordonNode(node); err != nil {
		return err
	}

	return c.JSON(200, h.builder.BuildNodeResponse(node))
}
