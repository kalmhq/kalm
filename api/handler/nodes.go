package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleListNodes(c echo.Context) error {
	builder := h.Builder(c)

	if !builder.CanViewCluster() {
		return resources.NoClusterViewerRoleError
	}

	res, err := builder.ListNodes()

	if err != nil {
		return err
	}

	return c.JSON(200, res)
}

func (h *ApiHandler) handleCordonNode(c echo.Context) error {
	builder := h.Builder(c)

	if !builder.CanEditCluster() {
		return resources.NoClusterEditorRoleError
	}

	node, err := builder.GetNode(c.Param("name"))

	if err != nil {
		return err
	}

	if err := builder.CordonNode(node); err != nil {
		return err
	}

	return c.JSON(200, builder.BuildNodeResponse(node))
}

func (h *ApiHandler) handleUncordonNode(c echo.Context) error {
	builder := h.Builder(c)

	if !builder.CanEditCluster() {
		return resources.NoClusterEditorRoleError
	}

	node, err := builder.GetNode(c.Param("name"))

	if err != nil {
		return err
	}

	if err := builder.UncordonNode(node); err != nil {
		return err
	}

	return c.JSON(200, builder.BuildNodeResponse(node))
}
