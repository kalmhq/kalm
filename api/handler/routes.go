package handler

import (
	"fmt"

	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) InstallHttpRouteHandlers(e *echo.Group) {
	e.GET("/httproutes", h.handleListAllRoutes)
	e.POST("/httproutes", h.handleCreateRoute)
	e.PUT("/httproutes/:name", h.handleUpdateRoute)
	e.DELETE("/httproutes/:name", h.handleDeleteRoute)
}

func (h *ApiHandler) handleListAllRoutes(c echo.Context) error {
	list, err := h.resourceManager.GetHttpRoutes()
	list = h.filterAuthorizedHttpRoutes(c, list)

	if err != nil {
		return err
	}

	return c.JSON(200, list)
}

func (h *ApiHandler) handleCreateRoute(c echo.Context) (err error) {
	currentUser := getCurrentUser(c)

	var route *resources.HttpRoute
	if route, err = getHttpRouteFromContext(c); err != nil {
		return err
	}

	if !h.clientManager.CanOperateHttpRoute(currentUser, "edit", route) {
		return resources.InsufficientPermissionsError
	}

	if route, err = h.resourceManager.CreateHttpRoute(route); err != nil {
		return err
	}

	return c.JSON(201, route)
}

func (h *ApiHandler) handleUpdateRoute(c echo.Context) (err error) {
	currentUser := getCurrentUser(c)

	var route *resources.HttpRoute
	if route, err = getHttpRouteFromContext(c); err != nil {
		return err
	}

	if _, err := h.resourceManager.GetHttpRoute("", c.Param("name")); err != nil {
		return nil
	}

	// TODO: check if current user can edit all old http route destinations
	if !h.clientManager.CanOperateHttpRoute(currentUser, "edit", route) {
		return resources.InsufficientPermissionsError
	}

	if route, err = h.resourceManager.UpdateHttpRoute(route); err != nil {
		return err
	}

	return c.JSON(200, route)
}

func (h *ApiHandler) handleDeleteRoute(c echo.Context) (err error) {
	route, err := h.resourceManager.GetHttpRoute("", c.Param("name"))
	if err != nil {
		return nil
	}

	if !h.clientManager.CanOperateHttpRoute(getCurrentUser(c), "edit", route) {
		return resources.InsufficientPermissionsError
	}

	if err = h.resourceManager.DeleteHttpRoute("", route.Name); err != nil {
		return err
	}

	return c.NoContent(200)
}

func getHttpRouteFromContext(c echo.Context) (*resources.HttpRoute, error) {
	var route resources.HttpRoute

	if err := c.Bind(&route); err != nil {
		return nil, err
	}

	if route.HttpRouteSpec == nil {
		return nil, fmt.Errorf("must provide route spec")
	}

	return &route, nil
}

func (h *ApiHandler) filterAuthorizedHttpRoutes(c echo.Context, records []*resources.HttpRoute) []*resources.HttpRoute {
	l := len(records)

	for i := 0; i < l; i++ {
		if !h.clientManager.CanOperateHttpRoute(getCurrentUser(c), "view", records[i]) {
			records[l-1], records[i] = records[i], records[l-1]
			i--
			l--
		}
	}

	return records[:l]
}
