package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleListSSOConfig(c echo.Context) error {
	ssoConfig, err := h.Builder(c).GetSSOConfig()

	if err != nil {
		return err
	}

	return c.JSON(200, ssoConfig)
}

func (h *ApiHandler) handleDeleteSSOConfig(c echo.Context) error {
	err := h.Builder(c).DeleteSSOConfig()

	if err != nil {
		return err
	}

	return c.NoContent(200)
}

func (h *ApiHandler) handleUpdateSSOConfig(c echo.Context) error {
	ssoConfig := &resources.SSOConfig{}

	if err := c.Bind(ssoConfig); err != nil {
		return err
	}

	ssoConfig, err := h.Builder(c).UpdateSSOConfig(ssoConfig)

	if err != nil {
		return err
	}

	return c.JSON(200, ssoConfig)
}

func (h *ApiHandler) handleCreateSSOConfig(c echo.Context) error {
	ssoConfig := &resources.SSOConfig{}

	if err := c.Bind(ssoConfig); err != nil {
		return err
	}

	ssoConfig, err := h.Builder(c).CreateSSOConfig(ssoConfig)

	if err != nil {
		return err
	}

	return c.JSON(201, ssoConfig)
}

func (h *ApiHandler) handleListProtectedEndpoints(c echo.Context) error {
	endpoints, err := h.Builder(c).ListProtectedEndpoints()

	if err != nil {
		return err
	}

	return c.JSON(200, endpoints)
}

func (h *ApiHandler) handleDeleteProtectedEndpoints(c echo.Context) error {
	protectedEndpoint := &resources.ProtectedEndpoint{}

	if err := c.Bind(protectedEndpoint); err != nil {
		return err
	}

	err := h.Builder(c).DeleteProtectedEndpoints(protectedEndpoint)

	if err != nil {
		return err
	}

	return c.NoContent(200)
}

func (h *ApiHandler) handleCreateProtectedEndpoints(c echo.Context) error {
	protectedEndpoint := &resources.ProtectedEndpoint{}

	if err := c.Bind(protectedEndpoint); err != nil {
		return err
	}

	protectedEndpoint, err := h.Builder(c).CreateProtectedEndpoint(protectedEndpoint)

	if err != nil {
		return err
	}

	return c.JSON(201, protectedEndpoint)
}
