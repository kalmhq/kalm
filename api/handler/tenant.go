package handler

import (
	"fmt"

	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/rand"
)

func (h *ApiHandler) InstallTenantHandlers(e *echo.Group) {
	e.GET("/tenants/current", h.handleGetCurrentTenant) // Get current virtual cluster info

	e.GET("/tenants", h.handleListTenants)                // Get all virtual clusters info
	e.GET("/tenants/:name", h.handleGetTenant)            // get single virtual cluster info
	e.POST("/tenants", h.handleCreateTenant)              // Create virtual cluster
	e.POST("/tenants/:name/pause", h.handlePauseTenant)   // Pause virtual cluster
	e.POST("/tenants/:name/resume", h.handleResumeTenant) // Resume virtual cluster
	e.PUT("/tenants/:name", h.handleUpdateTenant)         // update virtual cluster billing plan
	e.DELETE("/tenants/:name", h.handleDeleteTenant)      // internal

	e.POST("/tenants/:name/owners", h.handleAddTenantOwners)
	e.DELETE("/tenants/:name/owners", h.handleDeleteTenantOwners)
}

func (h *ApiHandler) handleListTenants(c echo.Context) error {
	h.MustCanManageCluster(getCurrentUser(c))

	tenants, err := h.resourceManager.GetTenants()

	if err != nil {
		return err
	}

	return c.JSON(200, tenants)
}

func (h *ApiHandler) handleGetCurrentTenant(c echo.Context) error {
	currentUser := getCurrentUser(c)
	h.MustCanManage(currentUser, currentUser.Tenant+"/*", "*/*")

	tenant, err := h.resourceManager.GetTenant(currentUser.Tenant)

	if err != nil {
		return err
	}

	return c.JSON(200, tenant)
}

func (h *ApiHandler) handleGetTenant(c echo.Context) error {
	h.MustCanManageCluster(getCurrentUser(c))

	tenant, err := h.resourceManager.GetTenant(c.Param("name"))
	if err != nil {
		return err
	}

	return c.JSON(200, tenant)
}

func (h *ApiHandler) handleCreateTenant(c echo.Context) error {
	h.MustCanManageCluster(getCurrentUser(c))

	tenant, err := getResourcesTenantFromContext(c)

	if err != nil {
		return err
	}

	tenant, err = h.resourceManager.CreateTenant(tenant)

	if err != nil {
		return err
	}

	tokenString := rand.String(128)
	tokenName := v1alpha1.GetAccessTokenNameFromToken(tokenString)
	accessToken := &v1alpha1.AccessToken{
		ObjectMeta: metaV1.ObjectMeta{
			Name: tokenName,
			Labels: map[string]string{
				v1alpha1.TenantNameLabelKey: tenant.Name,
			},
		},
		Spec: v1alpha1.AccessTokenSpec{
			Token: tokenString,
			Rules: []v1alpha1.AccessTokenRule{
				{
					Verb:      "view",
					Namespace: "*",
					Kind:      "*",
					Name:      "*",
				},
				{
					Verb:      "edit",
					Namespace: "*",
					Kind:      "*",
					Name:      "*",
				},
				{
					Verb:      "manage",
					Namespace: "*",
					Kind:      "*",
					Name:      "*",
				},
			},
			Creator:   getCurrentUser(c).Name,
			ExpiredAt: nil,
		},
	}

	if err := h.resourceManager.Create(accessToken); err != nil {
		return err
	}

	tenant.AccessToken = tokenString
	return c.JSON(201, tenant)
}

func (h *ApiHandler) handlePauseTenant(c echo.Context) error {
	h.MustCanManageCluster(getCurrentUser(c))

	return h.resourceManager.PauseTenant(c.Param("name"))
}

func (h *ApiHandler) handleResumeTenant(c echo.Context) error {
	h.MustCanManageCluster(getCurrentUser(c))

	return h.resourceManager.ResumeTenant(c.Param("name"))
}

func (h *ApiHandler) handleUpdateTenant(c echo.Context) error {
	h.MustCanManageCluster(getCurrentUser(c))

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
	h.MustCanManageCluster(getCurrentUser(c))

	return h.resourceManager.DeleteTenant(c.Param("name"))
}

func getResourcesTenantFromContext(c echo.Context) (*resources.Tenant, error) {
	var tenant resources.Tenant

	if err := c.Bind(&tenant); err != nil {
		return nil, err
	}

	return &tenant, nil
}

type ownersReq struct {
	Owners []string `json:"owners"`
}

func (h *ApiHandler) handleAddTenantOwners(c echo.Context) error {
	h.MustCanManageCluster(getCurrentUser(c))

	tenant, err := h.resourceManager.GetTenant(c.Param("name"))
	if err != nil {
		return err
	}

	var req ownersReq
	if err := c.Bind(&req); err != nil {
		return err
	}

	if err := h.addOrDeleteTenantOwners(tenant, req.Owners, true); err != nil {
		return err
	}

	return c.JSON(200, tenant)
}

func (h *ApiHandler) handleDeleteTenantOwners(c echo.Context) error {
	h.MustCanManageCluster(getCurrentUser(c))

	tenant, err := h.resourceManager.GetTenant(c.Param("name"))
	if err != nil {
		return err
	}

	var req ownersReq
	if err := c.Bind(&req); err != nil {
		return err
	}

	if err := h.addOrDeleteTenantOwners(tenant, req.Owners, false); err != nil {
		return err
	}

	return c.JSON(200, tenant)
}

func (h *ApiHandler) addOrDeleteTenantOwners(tenant *resources.Tenant, ownersToUpdate []string, isAdd bool) error {

	ownerMap := make(map[string]interface{})
	for _, owner := range tenant.Owners {
		ownerMap[owner] = true
	}

	for _, owner := range ownersToUpdate {
		if isAdd {
			ownerMap[owner] = true
		} else {
			delete(ownerMap, owner)
		}
	}

	var updatedOwners []string
	for k := range ownerMap {
		updatedOwners = append(updatedOwners, k)
	}

	tenant.Owners = updatedOwners

	_, err := h.resourceManager.UpdateTenant(tenant)
	return err
}
