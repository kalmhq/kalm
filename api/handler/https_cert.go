package handler

import (
	"fmt"
	"github.com/kalmhq/kalm/api/errors"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleListHttpsCerts(c echo.Context) error {
	if !h.clientManager.CanViewCluster(getCurrentUser(c)) {
		return resources.NoClusterViewerRoleError
	}

	httpsCerts, err := h.resourceManager.GetHttpsCerts()
	if err != nil {
		return err
	}

	return c.JSON(200, httpsCerts)
}

func (h *ApiHandler) handleGetHttpsCert(c echo.Context) error {
	if !h.clientManager.CanViewCluster(getCurrentUser(c)) {
		return resources.NoClusterViewerRoleError
	}

	httpsCert, err := h.resourceManager.GetHttpsCert(c.Param("name"))

	if err != nil {
		return err
	}

	return c.JSON(200, httpsCert)
}

func (h *ApiHandler) handleCreateHttpsCert(c echo.Context) error {
	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.NoClusterEditorRoleError
	}

	httpsCert, err := getHttpsCertFromContext(c)

	if err != nil {
		return err
	}

	if httpsCert.IsSelfManaged {
		return fmt.Errorf("for selfManaged certs, use /upload instead")
	}

	httpsCertResp, err := h.resourceManager.CreateAutoManagedHttpsCert(httpsCert)

	if err != nil {
		return err
	}

	return c.JSON(201, httpsCertResp)
}

func (h *ApiHandler) handleUploadHttpsCert(c echo.Context) error {
	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.NoClusterEditorRoleError
	}

	httpsCert, err := getHttpsCertFromContext(c)

	if err != nil {
		return err
	}

	if !httpsCert.IsSelfManaged {
		return fmt.Errorf("can only upload selfManaged certs")
	}

	httpsCertResp, err := h.resourceManager.CreateSelfManagedHttpsCert(httpsCert)

	if err != nil {
		return err
	}

	return c.JSON(201, httpsCertResp)
}

func (h *ApiHandler) handleUpdateHttpsCert(c echo.Context) error {
	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.NoClusterEditorRoleError
	}

	httpsCert, err := getHttpsCertFromContext(c)
	if err != nil {
		return err
	}

	if !httpsCert.IsSelfManaged {
		return errors.NewBadRequest("Only uploaded cert is editable.")
	}

	httpsCertResp, err := h.resourceManager.UpdateSelfManagedCert(httpsCert)

	if err != nil {
		return err
	}

	return c.JSON(200, httpsCertResp)
}

func (h *ApiHandler) handleDeleteHttpsCert(c echo.Context) error {
	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.NoClusterEditorRoleError
	}

	err := h.resourceManager.DeleteHttpsCert(c.Param("name"))

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
