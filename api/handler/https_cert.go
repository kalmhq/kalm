package handler

import (
	"fmt"

	"github.com/kalmhq/kalm/api/errors"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (h *ApiHandler) InstallHttpsCertsHandlers(e *echo.Group) {
	e.GET("/httpscerts", h.handleListHttpsCerts)
	e.GET("/httpscerts/:name", h.handleGetHttpsCert)
	e.POST("/httpscerts", h.handleCreateHttpsCert)
	e.POST("/httpscerts/upload", h.handleUploadHttpsCert)
	e.PUT("/httpscerts/:name", h.handleUpdateHttpsCert)
	e.DELETE("/httpscerts/:name", h.handleDeleteHttpsCert)
}

// handlers

func (h *ApiHandler) handleListHttpsCerts(c echo.Context) error {
	// TODO: certs are required to support http route
	// h.MustCanManageCluster(getCurrentUser(c))
	h.MustCanViewCluster(getCurrentUser(c))

	httpsCerts, err := h.resourceManager.GetHttpsCerts()

	if err != nil {
		return err
	}

	return c.JSON(200, httpsCerts)
}

func (h *ApiHandler) handleGetHttpsCert(c echo.Context) error {
	// TODO: certs are required to support http route
	// h.MustCanManageCluster(getCurrentUser(c))
	h.MustCanViewCluster(getCurrentUser(c))

	cert, err := h.getHttpsCertFromContext(c)

	if err != nil {
		return err
	}

	return c.JSON(200, cert)
}

func (h *ApiHandler) handleCreateHttpsCert(c echo.Context) error {
	h.MustCanManageCluster(getCurrentUser(c))

	httpsCert, err := bindHttpsCertFromRequestBody(c)

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
	h.MustCanManageCluster(getCurrentUser(c))

	httpsCert, err := bindHttpsCertFromRequestBody(c)

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
	h.MustCanManageCluster(getCurrentUser(c))

	httpsCert, err := bindHttpsCertFromRequestBody(c)

	if err != nil {
		return err
	}

	if !httpsCert.IsSelfManaged {
		return errors.NewBadRequest("Only uploaded cert is editable.")
	}

	if c.Param("name") != httpsCert.Name {
		return errors.NewBadRequest("Name in url and body are mismatched")
	}

	httpsCertResp, err := h.resourceManager.UpdateSelfManagedCert(httpsCert)

	if err != nil {
		return err
	}

	return c.JSON(200, httpsCertResp)
}

func (h *ApiHandler) handleDeleteHttpsCert(c echo.Context) error {
	h.MustCanManageCluster(getCurrentUser(c))

	if err := h.resourceManager.DeleteHttpsCert(c.Param("name")); err != nil {
		return err
	}

	return c.NoContent(200)
}

func bindHttpsCertFromRequestBody(c echo.Context) (*resources.HttpsCert, error) {
	var httpsCert resources.HttpsCert

	if err := c.Bind(&httpsCert); err != nil {
		return nil, err
	}

	return &httpsCert, nil
}

func (h *ApiHandler) getHttpsCertFromContext(c echo.Context) (*resources.HttpsCertResp, error) {
	list, err := h.resourceManager.GetHttpsCerts(client.MatchingField("metadata.name", c.Param("name")), client.Limit(1))

	if err != nil {
		return nil, err
	}

	if len(list) < 1 {
		return nil, errors.NewNotFound("")
	}

	return list[0], nil
}
