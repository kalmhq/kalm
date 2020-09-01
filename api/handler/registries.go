package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleListRegistries(c echo.Context) error {
	if !h.clientManager.CanViewCluster(getCurrentUser(c)) {
		return resources.NoClusterViewerRoleError
	}

	list, err := h.builder.GetDockerRegistries()

	if err != nil {
		return err
	}

	return c.JSON(200, list)
}

func (h *ApiHandler) handleGetRegistry(c echo.Context) error {
	if !h.clientManager.CanViewCluster(getCurrentUser(c)) {
		return resources.NoClusterViewerRoleError
	}

	registry, err := h.builder.GetDockerRegistry(c.Param("name"))

	if err != nil {
		return err
	}

	return c.JSON(200, registry)
}

func (h *ApiHandler) handleCreateRegistry(c echo.Context) (err error) {
	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.NoClusterEditorRoleError
	}

	var registry *resources.DockerRegistry

	if registry, err = getDockerRegistryFromContext(c); err != nil {
		return err
	}

	if registry, err = h.builder.CreateDockerRegistry(registry); err != nil {
		return err
	}

	return c.JSON(201, registry)
}

func (h *ApiHandler) handleUpdateRegistry(c echo.Context) (err error) {
	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.NoClusterEditorRoleError
	}

	var registry *resources.DockerRegistry

	if registry, err = getDockerRegistryFromContext(c); err != nil {
		return err
	}

	if registry, err = h.builder.UpdateDockerRegistry(registry); err != nil {
		return err
	}

	return c.JSON(200, registry)
}

func (h *ApiHandler) handleDeleteRegistry(c echo.Context) error {
	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.NoClusterEditorRoleError
	}

	err := h.builder.DeleteDockerRegistry(c.Param("name"))

	if err != nil {
		return err
	}

	return c.NoContent(200)
}

func getDockerRegistryFromContext(c echo.Context) (*resources.DockerRegistry, error) {
	var registry resources.DockerRegistry

	if err := c.Bind(&registry); err != nil {
		return nil, err
	}

	return &registry, nil
}
