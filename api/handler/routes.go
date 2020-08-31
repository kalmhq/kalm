package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleListAllRoutes(c echo.Context) error {
	builder := h.Builder(c)

	if !builder.CanViewCluster() {
		return resources.NoClusterViewerRoleError
	}

	list, err := builder.GetHttpRoutes("")

	if err != nil {
		return err
	}

	return c.JSON(200, list)
}

func (h *ApiHandler) handleListRoutes(c echo.Context) error {
	builder := h.Builder(c)

	if !builder.CanViewCluster() {
		return resources.NoClusterViewerRoleError
	}

	if !builder.CanViewCluster() {
		return resources.NoClusterViewerRoleError
	}

	list, err := builder.GetHttpRoutes(c.Param("namespace"))

	if err != nil {
		return err
	}

	return c.JSON(200, list)
}

func (h *ApiHandler) handleCreateRoute(c echo.Context) (err error) {
	builder := h.Builder(c)

	if !builder.CanEditCluster() {
		return resources.NoClusterEditorRoleError
	}

	var route *resources.HttpRoute

	if route, err = getHttpRouteFromContext(c); err != nil {
		return err
	}

	if route, err = builder.CreateHttpRoute(route); err != nil {
		return err
	}

	return c.JSON(201, route)
}

func (h *ApiHandler) handleUpdateRoute(c echo.Context) (err error) {
	builder := h.Builder(c)

	if !builder.CanEditCluster() {
		return resources.NoClusterEditorRoleError
	}

	var route *resources.HttpRoute

	if route, err = getHttpRouteFromContext(c); err != nil {
		return err
	}

	if route, err = builder.UpdateHttpRoute(route); err != nil {
		return err
	}

	return c.JSON(200, route)
}

func (h *ApiHandler) handleDeleteRoute(c echo.Context) (err error) {
	builder := h.Builder(c)

	if !builder.CanEditCluster() {
		return resources.NoClusterEditorRoleError
	}

	if err = builder.DeleteHttpRoute(c.Param("namespace"), c.Param("name")); err != nil {
		return err
	}

	return c.NoContent(200)
}

func getHttpRouteFromContext(c echo.Context) (*resources.HttpRoute, error) {
	var route resources.HttpRoute

	if err := c.Bind(&route); err != nil {
		return nil, err
	}

	return &route, nil
}
