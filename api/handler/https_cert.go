package handler

import (
	"fmt"

	"github.com/kalmhq/kalm/api/errors"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (h *ApiHandler) InstallHttpsCertsHandlers(e *echo.Group) {
	e.GET("/httpscerts", h.handleListHttpsCerts, h.requireIsTenantOwner)
	e.GET("/httpscerts/:name", h.handleGetHttpsCert, h.requireIsTenantOwner, h.setHttpsCertToContext)
	e.POST("/httpscerts", h.handleCreateHttpsCert, h.requireIsTenantOwner)
	e.POST("/httpscerts/upload", h.handleUploadHttpsCert, h.requireIsTenantOwner)
	e.PUT("/httpscerts/:name", h.handleUpdateHttpsCert, h.requireIsTenantOwner, h.setHttpsCertToContext)
	e.DELETE("/httpscerts/:name", h.handleDeleteHttpsCert, h.requireIsTenantOwner, h.setHttpsCertToContext)
}

// middlewares

func (h *ApiHandler) setHttpsCertToContext(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		currentUser := getCurrentUser(c)

		list, err := h.resourceManager.GetHttpsCerts(client.MatchingLabels{
			v1alpha1.TenantNameLabelKey: currentUser.Tenant,
		}, client.MatchingField("metadata.name", c.Param("name")), client.Limit(1))

		if err != nil {
			return err
		}

		if len(list) < 1 {
			return errors.NewNotFound("")
		}

		c.Set("HttpsCert", list[0])

		return next(c)
	}
}

func (h *ApiHandler) getHttpsCertFromContext(c echo.Context) *resources.HttpsCert {
	httpsCert := c.Get("HttpsCert")
	return httpsCert.(*resources.HttpsCert)
}

// handlers

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
	cert := h.getHttpsCertFromContext(c)
	return c.JSON(200, cert)
}

func (h *ApiHandler) handleCreateHttpsCert(c echo.Context) error {
	currentUser := getCurrentUser(c)

	httpsCert, err := bindHttpsCertFromRequestBody(c)

	if err != nil {
		return err
	}

	if httpsCert.IsSelfManaged {
		return fmt.Errorf("for selfManaged certs, use /upload instead")
	}

	httpsCert.Tenant = currentUser.Tenant

	httpsCertResp, err := h.resourceManager.CreateAutoManagedHttpsCert(httpsCert)

	if err != nil {
		return err
	}

	return c.JSON(201, httpsCertResp)
}

func (h *ApiHandler) handleUploadHttpsCert(c echo.Context) error {
	currentUser := getCurrentUser(c)

	httpsCert, err := bindHttpsCertFromRequestBody(c)

	if err != nil {
		return err
	}

	if !httpsCert.IsSelfManaged {
		return fmt.Errorf("can only upload selfManaged certs")
	}

	httpsCert.Tenant = currentUser.Tenant

	httpsCertResp, err := h.resourceManager.CreateSelfManagedHttpsCert(httpsCert)

	if err != nil {
		return err
	}

	return c.JSON(201, httpsCertResp)
}

func (h *ApiHandler) handleUpdateHttpsCert(c echo.Context) error {
	currentUser := getCurrentUser(c)

	httpsCert, err := bindHttpsCertFromRequestBody(c)

	if err != nil {
		return err
	}

	if !httpsCert.IsSelfManaged {
		return errors.NewBadRequest("Only uploaded cert is editable.")
	}

	httpsCert.Tenant = currentUser.Tenant
	httpsCertResp, err := h.resourceManager.UpdateSelfManagedCert(httpsCert)

	if err != nil {
		return err
	}

	return c.JSON(200, httpsCertResp)
}

func (h *ApiHandler) handleDeleteHttpsCert(c echo.Context) error {
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
