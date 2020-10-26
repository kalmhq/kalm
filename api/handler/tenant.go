package handler

import (
	"fmt"

	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleListTenants(c echo.Context) error {
	if !h.clientManager.CanManageCluster(getCurrentUser(c)) {
		return resources.NoClusterOwnerRoleError
	}

	tenants, err := h.resourceManager.GetTenants()

	if err != nil {
		return err
	}

	return c.JSON(200, tenants)
}

func (h *ApiHandler) handleGetTenant(c echo.Context) error {
	if !h.clientManager.CanManageCluster(getCurrentUser(c)) {
		return resources.NoClusterOwnerRoleError
	}

	tenant, err := h.resourceManager.GetTenant(c.Param("name"))

	if err != nil {
		return err
	}

	return c.JSON(200, tenant)
}

func (h *ApiHandler) handleCreateTenant(c echo.Context) error {
	if !h.clientManager.CanManageCluster(getCurrentUser(c)) {
		return resources.NoClusterOwnerRoleError
	}

	tenant, err := getResourcesTenantFromContext(c)

	if err != nil {
		return err
	}

	tenant, err = h.resourceManager.CreateTenant(tenant)

	if err != nil {
		return err
	}

	return c.JSON(201, tenant)
}

func (h *ApiHandler) handlePauseTenant(c echo.Context) error {
	if !h.clientManager.CanManageCluster(getCurrentUser(c)) {
		return resources.NoClusterOwnerRoleError
	}

	return h.resourceManager.PauseTenant(c.Param("name"))
}

func (h *ApiHandler) handleResumeTenant(c echo.Context) error {
	if !h.clientManager.CanManageCluster(getCurrentUser(c)) {
		return resources.NoClusterOwnerRoleError
	}

	return h.resourceManager.ResumeTenant(c.Param("name"))
}

func (h *ApiHandler) handleUpdateTenant(c echo.Context) error {
	if !h.clientManager.CanManageCluster(getCurrentUser(c)) {
		return resources.NoClusterOwnerRoleError
	}

	tenant, err := getResourcesTenantFromContext(c)

	if err != nil {
		return err
	}

	if tenant.Name != c.Param("name") {
		return fmt.Errorf("name in url and body mismatch")
	}

	tenant, err = h.resourceManager.UpdateTenant(tenant)

	if err != nil {
		return err
	}

	return c.JSON(200, tenant)
}

func (h *ApiHandler) handleDeleteTenant(c echo.Context) error {
	if !h.clientManager.CanManageCluster(getCurrentUser(c)) {
		return resources.NoClusterOwnerRoleError
	}

	return h.resourceManager.DeleteTenant(c.Param("name"))
}

func getResourcesTenantFromContext(c echo.Context) (*resources.Tenant, error) {
	var tenant resources.Tenant

	if err := c.Bind(&tenant); err != nil {
		return nil, err
	}

	return &tenant, nil
}
