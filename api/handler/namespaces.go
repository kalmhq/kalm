package handler

import (
	"github.com/labstack/echo/v4"
	"net/http"
)

func (h *ApiHandler) handleListNamespaces(c echo.Context) error {
	namespaces, err := h.Builder(c).ListNamespaces()

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, namespaces)
}

func (h *ApiHandler) handleCreateNamespace(c echo.Context) error {
	err := h.Builder(c).CreateNamespace(c.Param("name"))

	if err != nil {
		return err
	}

	return c.NoContent(http.StatusCreated)
}

func (h *ApiHandler) handleDeleteNamespace(c echo.Context) error {
	err := h.Builder(c).DeleteNamespace(c.Param("name"))

	if err != nil {
		return err
	}

	return c.NoContent(http.StatusOK)
}
