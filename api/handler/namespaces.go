package handler

import (
	"github.com/kalm-staging/kalm/api/resources"
	"github.com/labstack/echo/v4"
	"net/http"
)

func (h *ApiHandler) handleListNamespaces(c echo.Context) error {
	namespaces, err := resources.ListNamespaces(getK8sClient(c))

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, namespaces)
}

func (h *ApiHandler) handleCreateNamespace(c echo.Context) error {
	err := resources.CreateNamespace(getK8sClient(c), c.Param("name"))

	if err != nil {
		return err
	}

	return c.NoContent(http.StatusCreated)
}

func (h *ApiHandler) handleDeleteNamespace(c echo.Context) error {
	err := resources.DeleteNamespace(getK8sClient(c), c.Param("name"))

	if err != nil {
		return err
	}

	return c.NoContent(http.StatusOK)
}
