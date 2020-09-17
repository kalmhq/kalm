package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/controllers"
	"github.com/labstack/echo/v4"
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
)

func (h *ApiHandler) handleGetApplications(c echo.Context) error {
	namespaces, err := h.resourceManager.GetNamespaces()
	namespaces = h.filterAuthorizedApplications(c, namespaces)

	if err != nil {
		return err
	}

	res, err := h.resourceManager.BuildApplicationListResponse(namespaces)

	if err != nil {
		return err
	}

	return c.JSON(200, res)
}

func (h *ApiHandler) handleGetApplicationDetails(c echo.Context) error {
	if !h.clientManager.CanViewNamespace(getCurrentUser(c), c.Param("name")) {
		return resources.NoNamespaceViewerRoleError(c.Param("name"))
	}

	namespace, err := h.resourceManager.GetNamespace(c.Param("name"))

	if err != nil {
		return err
	}

	res, err := h.resourceManager.BuildApplicationDetails(namespace)

	if err != nil {
		return err
	}

	return c.JSON(200, res)
}

func (h *ApiHandler) handleCreateApplication(c echo.Context) error {
	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.NoClusterEditorRoleError
	}

	ns, err := getKalmNamespaceFromContext(c)

	if err != nil {
		return err
	}

	if err := h.resourceManager.CreateNamespace(ns); err != nil {
		return err
	}

	res, err := h.resourceManager.BuildApplicationDetails(ns)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, res)
}

func (h *ApiHandler) handleDeleteApplication(c echo.Context) error {
	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.NoClusterEditorRoleError
	}

	if err := h.resourceManager.DeleteNamespace(&coreV1.Namespace{ObjectMeta: metaV1.ObjectMeta{Name: c.Param("name")}}); err != nil {
		return err
	}

	return c.NoContent(http.StatusNoContent)
}

func getKalmNamespaceFromContext(c echo.Context) (*coreV1.Namespace, error) {
	var ns resources.Application

	if err := c.Bind(&ns); err != nil {
		return nil, err
	}

	coreV1Namespace := coreV1.Namespace{
		ObjectMeta: metaV1.ObjectMeta{
			Name: ns.Name,
			Labels: map[string]string{
				controllers.KalmEnableLabelName: controllers.KalmEnableLabelValue,
			},
		},
	}

	return &coreV1Namespace, nil
}
