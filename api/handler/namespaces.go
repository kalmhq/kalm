package handler

import (
	"github.com/kapp-staging/kapp/api/resources"
	"github.com/labstack/echo/v4"
	"net/http"
)

type Namespace struct {
	Name string `json:"name"`
}

type NamespaceListResponse struct {
	Namespaces []Namespace `json:"namespaces"`
}

func (h *ApiHandler) handleListNamespaces(c echo.Context) error {
	namespaces, err := resources.ListNamespaces(getK8sClient(c))

	if err != nil {
		return err
	}

	res := NamespaceListResponse{
		Namespaces: make([]Namespace, 0),
	}

	for _, namespace := range namespaces {
		res.Namespaces = append(res.Namespaces, Namespace{
			Name: namespace.Name,
		})
	}

	return c.JSON(http.StatusOK, res)
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
