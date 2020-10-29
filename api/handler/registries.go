package handler

import (
	"github.com/kalmhq/kalm/api/errors"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (h *ApiHandler) InstallRegistriesHandlers(e *echo.Group) {
	e.GET("/registries", h.handleListRegistries, h.requireIsTenantOwner)
	e.GET("/registries/:name", h.handleGetRegistry, h.requireIsTenantOwner, h.setRegistryToContext)
	e.PUT("/registries/:name", h.handleUpdateRegistry, h.requireIsTenantOwner, h.setRegistryToContext)
	e.POST("/registries", h.handleCreateRegistry, h.requireIsTenantOwner)
	e.DELETE("/registries/:name", h.handleDeleteRegistry, h.requireIsTenantOwner, h.setRegistryToContext)
}

// middlewares

func (h *ApiHandler) setRegistryToContext(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		currentUser := getCurrentUser(c)

		list, err := h.resourceManager.GetDockerRegistries(client.MatchingLabels{
			v1alpha1.TenantNameLabelKey: currentUser.Tenant,
		}, client.MatchingField("metadata.name", c.Param("name")), client.Limit(1))

		if err != nil {
			return err
		}

		if len(list) < 1 {
			return errors.NewNotFound("")
		}

		c.Set("Registry", list[0])

		return next(c)
	}
}

func (h *ApiHandler) getRegistryFromContext(c echo.Context) *resources.DockerRegistry {
	registry := c.Get("Registry")
	return registry.(*resources.DockerRegistry)
}

// handlers

func (h *ApiHandler) handleListRegistries(c echo.Context) error {
	list, err := h.resourceManager.GetDockerRegistries(client.MatchingLabels{
		v1alpha1.TenantNameLabelKey: getCurrentUser(c).Tenant,
	})

	if err != nil {
		return err
	}

	return c.JSON(200, list)
}

func (h *ApiHandler) handleGetRegistry(c echo.Context) error {
	registry := h.getRegistryFromContext(c)
	return c.JSON(200, registry)
}

func (h *ApiHandler) handleCreateRegistry(c echo.Context) (err error) {
	currentUser := getCurrentUser(c)

	var registry *resources.DockerRegistry

	if registry, err = bindDockerRegistryFromRequestBody(c); err != nil {
		return err
	}

	registry.Tenant = currentUser.Tenant

	if registry, err = h.resourceManager.CreateDockerRegistry(registry); err != nil {
		return err
	}

	return c.JSON(201, registry)
}

func (h *ApiHandler) handleUpdateRegistry(c echo.Context) (err error) {
	currentUser := getCurrentUser(c)

	var registry *resources.DockerRegistry

	if registry, err = bindDockerRegistryFromRequestBody(c); err != nil {
		return err
	}

	registry.Tenant = currentUser.Tenant

	if registry, err = h.resourceManager.UpdateDockerRegistry(registry); err != nil {
		return err
	}

	return c.JSON(200, registry)
}

func (h *ApiHandler) handleDeleteRegistry(c echo.Context) error {
	currentUser := getCurrentUser(c)
	registry := h.getRegistryFromContext(c)

	if registry.Tenant != currentUser.Tenant {
		return resources.NotTenantOwnerError
	}

	if err := h.resourceManager.DeleteDockerRegistry(c.Param("name")); err != nil {
		return err
	}

	return c.NoContent(200)
}

func bindDockerRegistryFromRequestBody(c echo.Context) (*resources.DockerRegistry, error) {
	var registry resources.DockerRegistry

	if err := c.Bind(&registry); err != nil {
		return nil, err
	}

	return &registry, nil
}
