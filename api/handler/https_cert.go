package handler

import (
	"fmt"

	"github.com/kalmhq/kalm/api/errors"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (h *ApiHandler) handleListHttpsCerts(c echo.Context) error {
	httpsCerts, err := h.resourceManager.GetHttpsCerts(client.MatchingLabels{
		v1alpha1.TenantNameLabelKey: getCurrentUser(c).Tenant,
	})

	if err != nil {
		return err
	}

	return c.JSON(200, httpsCerts)
}

func (h *ApiHandler) handleGetHttpsCert(c echo.Context) error {
	httpsCert, err := h.resourceManager.GetHttpsCert(c.Param("name"))

	if err != nil {
		return err
	}

	tenantName, err := v1alpha1.GetTenantNameFromObj(httpsCert)

	if err != nil {
		return err
	}

	if tenantName != getCurrentUser(c).Tenant {
		return resources.UnauthorizedTenantError
	}

	return c.JSON(200, resources.BuildHttpsCertResponse(httpsCert))
}

func (h *ApiHandler) handleCreateHttpsCert(c echo.Context) error {
	currentUser := getCurrentUser(c)

	if !h.resourceManager.IsATenantOwner(currentUser.Email, currentUser.Tenant) {
		return resources.NotATenantOwnerError
	}

	httpsCert, err := getHttpsCertFromContext(c)

	if err != nil {
		return err
	}

	if httpsCert.IsSelfManaged {
		return fmt.Errorf("for selfManaged certs, use /upload instead")
	}

	httpsCertResp, err := h.resourceManager.CreateAutoManagedHttpsCert(httpsCert, currentUser.Tenant)

	if err != nil {
		return err
	}

	return c.JSON(201, httpsCertResp)
}

func (h *ApiHandler) handleUploadHttpsCert(c echo.Context) error {
	currentUser := getCurrentUser(c)

	if !h.resourceManager.IsATenantOwner(currentUser.Email, currentUser.Tenant) {
		return resources.NotATenantOwnerError
	}

	httpsCert, err := getHttpsCertFromContext(c)

	if err != nil {
		return err
	}

	if !httpsCert.IsSelfManaged {
		return fmt.Errorf("can only upload selfManaged certs")
	}

	httpsCertResp, err := h.resourceManager.CreateSelfManagedHttpsCert(httpsCert, currentUser.Tenant)

	if err != nil {
		return err
	}

	return c.JSON(201, httpsCertResp)
}

func (h *ApiHandler) handleUpdateHttpsCert(c echo.Context) error {
	currentUser := getCurrentUser(c)

	if !h.resourceManager.IsATenantOwner(currentUser.Email, currentUser.Tenant) {
		return resources.NotATenantOwnerError
	}

	httpsCert, err := getHttpsCertFromContext(c)

	if err != nil {
		return err
	}

	if !httpsCert.IsSelfManaged {
		return errors.NewBadRequest("Only uploaded cert is editable.")
	}

	crdHttpCert, err := h.resourceManager.GetHttpsCert(httpsCert.Name)

	if err != nil {
		return err
	}

	tenantName, err := v1alpha1.GetTenantNameFromObj(crdHttpCert)

	if err != nil {
		return err
	}

	if tenantName != currentUser.Tenant {
		return resources.UnauthorizedTenantError
	}

	httpsCertResp, err := h.resourceManager.UpdateSelfManagedCert(httpsCert)

	if err != nil {
		return err
	}

	return c.JSON(200, httpsCertResp)
}

func (h *ApiHandler) handleDeleteHttpsCert(c echo.Context) error {
	currentUser := getCurrentUser(c)

	if !h.resourceManager.IsATenantOwner(currentUser.Email, currentUser.Tenant) {
		return resources.NotATenantOwnerError
	}

	crdHttpCert, err := h.resourceManager.GetHttpsCert(c.Param("name"))

	if err != nil {
		return err
	}

	tenantName, err := v1alpha1.GetTenantNameFromObj(crdHttpCert)

	if err != nil {
		return err
	}

	if tenantName != currentUser.Tenant {
		return resources.UnauthorizedTenantError
	}

	err = h.resourceManager.DeleteHttpsCert(c.Param("name"))

	if err != nil {
		return err
	}

	return c.NoContent(200)
}

func getHttpsCertFromContext(c echo.Context) (*resources.HttpsCert, error) {
	var httpsCert resources.HttpsCert

	if err := c.Bind(&httpsCert); err != nil {
		return nil, err
	}

	return &httpsCert, nil
}
