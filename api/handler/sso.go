package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleListSSOConfig(c echo.Context) error {
	if !h.clientManager.CanViewCluster(getCurrentUser(c)) {
		return resources.NoClusterViewerRoleError
	}

	ssoConfig, err := h.builder.GetSSOConfig()

	if err != nil {
		return err
	}

	return c.JSON(200, ssoConfig)
}

func (h *ApiHandler) handleDeleteSSOConfig(c echo.Context) error {
	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.NoClusterEditorRoleError
	}

	err := h.builder.DeleteSSOConfig()

	if err != nil {
		return err
	}

	return c.NoContent(200)
}

func (h *ApiHandler) handleUpdateSSOConfig(c echo.Context) error {
	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.NoClusterEditorRoleError
	}

	ssoConfig := &resources.SSOConfig{}

	if err := c.Bind(ssoConfig); err != nil {
		return err
	}

	ssoConfig, err := h.builder.UpdateSSOConfig(ssoConfig)

	if err != nil {
		return err
	}

	return c.JSON(200, ssoConfig)
}

func (h *ApiHandler) handleCreateSSOConfig(c echo.Context) error {
	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.NoClusterEditorRoleError
	}

	ssoConfig := &resources.SSOConfig{}

	if err := c.Bind(ssoConfig); err != nil {
		return err
	}

	ssoConfig, err := h.builder.CreateSSOConfig(ssoConfig)

	if err != nil {
		return err
	}

	return c.JSON(201, ssoConfig)
}

func (h *ApiHandler) handleListProtectedEndpoints(c echo.Context) error {
	if !h.clientManager.CanViewCluster(getCurrentUser(c)) {
		return resources.NoClusterViewerRoleError
	}

	endpoints, err := h.builder.ListProtectedEndpoints()

	if err != nil {
		return err
	}

	return c.JSON(200, endpoints)
}

func (h *ApiHandler) handleDeleteProtectedEndpoints(c echo.Context) error {
	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.NoClusterEditorRoleError
	}

	protectedEndpoint := &resources.ProtectedEndpoint{}

	if err := c.Bind(protectedEndpoint); err != nil {
		return err
	}

	err := h.builder.DeleteProtectedEndpoints(protectedEndpoint)

	if err != nil {
		return err
	}

	return c.NoContent(200)
}

func (h *ApiHandler) handleCreateProtectedEndpoints(c echo.Context) error {
	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.NoClusterEditorRoleError
	}

	protectedEndpoint := &resources.ProtectedEndpoint{}

	if err := c.Bind(protectedEndpoint); err != nil {
		return err
	}

	protectedEndpoint, err := h.builder.CreateProtectedEndpoint(protectedEndpoint)

	if err != nil {
		return err
	}

	return c.JSON(201, protectedEndpoint)
}

func (h *ApiHandler) handleUpdateProtectedEndpoints(c echo.Context) error {
	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.NoClusterEditorRoleError
	}

	protectedEndpoint := &resources.ProtectedEndpoint{}

	if err := c.Bind(protectedEndpoint); err != nil {
		return err
	}

	protectedEndpoint, err := h.builder.UpdateProtectedEndpoint(protectedEndpoint)

	if err != nil {
		return err
	}

	return c.JSON(200, protectedEndpoint)
}
