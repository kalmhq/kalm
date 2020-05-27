package handler

import (
	"github.com/kapp-staging/kapp/api/resources"
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleListRoutes(c echo.Context) error {
	list, err := h.Builder(c).GetHttpRoutes(c.Param("namespace"))

	if err != nil {
		return err
	}

	return c.JSON(200, list)
}

func (h *ApiHandler) handleCreateRoute(c echo.Context) (err error) {
	var route *resources.HttpRoute

	if route, err = getHttpRouteFromContext(c); err != nil {
		return err
	}

	if route, err = h.Builder(c).CreateHttpRoute(route); err != nil {
		return err
	}

	return c.JSON(201, route)
}

func (h *ApiHandler) handleUpdateRoute(c echo.Context) (err error) {
	var route *resources.HttpRoute

	if route, err = getHttpRouteFromContext(c); err != nil {
		return err
	}

	if route, err = h.Builder(c).UpdateHttpRoute(route); err != nil {
		return err
	}

	return c.JSON(200, route)
}

func (h *ApiHandler) handleDeleteRoute(c echo.Context) (err error) {
	if err = h.Builder(c).DeleteHttpRoute(c.Param("namespace"), c.Param("name")); err != nil {
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
