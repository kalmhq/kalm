package handler

import (
	"fmt"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleGetHttpsCerts(c echo.Context) error {

	// review-notes: only clusterViewer and above can see certs
	//   but nsEditor above can create routes using cert

	if !h.clientManager.CanViewCluster(getCurrentUser(c)) {
		return resources.NoClusterViewerRoleError
	}

	httpsCerts, err := h.resourceManager.GetHttpsCerts()
	if err != nil {
		return err
	}

	return c.JSON(200, httpsCerts)
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

	httpsCert, err = h.resourceManager.CreateAutoManagedHttpsCert(httpsCert)
	if err != nil {
		return err
	}

	return c.JSON(201, httpsCert)
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

	httpsCert, err = h.resourceManager.CreateSelfManagedHttpsCert(httpsCert)

	if err != nil {
		return err
	}

	return c.JSON(201, httpsCert)
}

func (h *ApiHandler) handleUpdateHttpsCert(c echo.Context) error {
	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.NoClusterEditorRoleError
	}

	httpsCert, err := getHttpsCertFromContext(c)
	if err != nil {
		return err
	}

	if httpsCert.IsSelfManaged {
		httpsCert, err = h.resourceManager.UpdateSelfManagedCert(httpsCert)
		if err != nil {
			return err
		}
	} else {
		httpsCert, err = h.resourceManager.UpdateAutoManagedCert(httpsCert)
		if err != nil {
			return err
		}
	}

	return c.JSON(200, httpsCert)
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
