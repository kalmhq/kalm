package handler

import (
	"fmt"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleGetHttpsCerts(c echo.Context) error {
	builder := h.Builder(c)

	if !builder.CanViewCluster() {
		return resources.NoClusterViewerRoleError
	}

	httpsCerts, err := builder.GetHttpsCerts()
	if err != nil {
		return err
	}

	return c.JSON(200, httpsCerts)
}

func (h *ApiHandler) handleCreateHttpsCert(c echo.Context) error {
	builder := h.Builder(c)

	if !builder.CanEditCluster() {
		return resources.NoClusterEditorRoleError
	}

	httpsCert, err := getHttpsCertFromContext(c)

	if err != nil {
		return err
	}

	if httpsCert.IsSelfManaged {
		return fmt.Errorf("for selfManaged certs, use /upload instead")
	}

	httpsCert, err = builder.CreateAutoManagedHttpsCert(httpsCert)
	if err != nil {
		return err
	}

	return c.JSON(201, httpsCert)
}

func (h *ApiHandler) handleUploadHttpsCert(c echo.Context) error {
	builder := h.Builder(c)

	if !builder.CanEditCluster() {
		return resources.NoClusterEditorRoleError
	}

	httpsCert, err := getHttpsCertFromContext(c)

	if err != nil {
		return err
	}

	if !httpsCert.IsSelfManaged {
		return fmt.Errorf("can only upload selfManaged certs")
	}

	httpsCert, err = builder.CreateSelfManagedHttpsCert(httpsCert)

	if err != nil {
		return err
	}

	return c.JSON(201, httpsCert)
}

func (h *ApiHandler) handleUpdateHttpsCert(c echo.Context) error {
	builder := h.Builder(c)

	if !builder.CanEditCluster() {
		return resources.NoClusterEditorRoleError
	}

	httpsCert, err := getHttpsCertFromContext(c)
	if err != nil {
		return err
	}

	if httpsCert.IsSelfManaged {
		httpsCert, err = builder.UpdateSelfManagedCert(httpsCert)
		if err != nil {
			return err
		}
	} else {
		httpsCert, err = builder.UpdateAutoManagedCert(httpsCert)
		if err != nil {
			return err
		}
	}

	return c.JSON(200, httpsCert)
}

func (h *ApiHandler) handleDeleteHttpsCert(c echo.Context) error {
	builder := h.Builder(c)

	if !builder.CanEditCluster() {
		return resources.NoClusterEditorRoleError
	}

	err := builder.DeleteHttpsCert(c.Param("name"))

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
