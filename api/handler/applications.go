package handler

import (
	"net/http"

	"github.com/kalmhq/kalm/api/errors"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/kalmhq/kalm/controller/controllers"
	"github.com/labstack/echo/v4"
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// installer

func (h *ApiHandler) InstallApplicationsHandlers(e *echo.Group) {
	e.GET("/applications", h.handleGetApplications)
	e.POST("/applications", h.handleCreateApplication)
	e.GET("/applications/:name", h.handleGetApplicationDetails, h.setApplicationIntoContext)
	e.DELETE("/applications/:name", h.handleDeleteApplication, h.requireIsTenantOwner, h.setApplicationIntoContext)
}

// middlewares

func (h *ApiHandler) setApplicationIntoContext(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		currentUser := getCurrentUser(c)

		list, err := h.resourceManager.GetNamespaces(client.MatchingLabels{
			v1alpha1.TenantNameLabelKey: currentUser.Tenant,
		}, client.MatchingField("metadata.name", c.Param("name")), client.Limit(1))

		if err != nil {
			return err
		}

		if len(list) < 1 {
			return errors.NewNotFound("")
		}

		c.Set("application", list[0])

		return next(c)
	}
}

func (h *ApiHandler) getApplicationFromContext(c echo.Context) *coreV1.Namespace {
	namespace := c.Get("application")
	return namespace.(*coreV1.Namespace)
}

// handlers

func (h *ApiHandler) handleGetApplications(c echo.Context) error {
	currentUser := getCurrentUser(c)
	namespaces, err := h.resourceManager.GetNamespaces(belongsToTenant(currentUser.Tenant))
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
	namespace := h.getApplicationFromContext(c)
	currentUser := getCurrentUser(c)

	if !h.clientManager.CanViewScope(currentUser, namespace.Name) {
		return resources.NoNamespaceViewerRoleError(namespace.Name)
	}

	res, err := h.resourceManager.BuildApplicationDetails(namespace)

	if err != nil {
		return err
	}

	return c.JSON(200, res)
}

func (h *ApiHandler) handleCreateApplication(c echo.Context) error {
	currentUser := getCurrentUser(c)

	if !h.clientManager.Can(currentUser, "create", currentUser.Tenant+"/*", "applications/*") {
		panic("TODO: fix this")
	}

	ns, err := bindKalmNamespaceFromRequestBody(c)

	if err != nil {
		return err
	}

	if err := v1alpha1.SetTenantForObj(ns, currentUser.Tenant); err != nil {
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
	namespace := h.getApplicationFromContext(c)

	if err := h.resourceManager.DeleteNamespace(namespace); err != nil {
		return err
	}

	return c.NoContent(http.StatusNoContent)
}

// helper

func bindKalmNamespaceFromRequestBody(c echo.Context) (*coreV1.Namespace, error) {
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
