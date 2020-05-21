package handler

import (
	"fmt"
	"github.com/kapp-staging/kapp/api/resources"
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleGetHttpsCerts(context echo.Context) error {
	httpsCerts, err := h.Builder(context).GetHttpsCerts()
	if err != nil {
		return err
	}

	return context.JSON(200, httpsCerts)
}

func (h *ApiHandler) handleCreateHttpsCert(context echo.Context) error {
	httpsCert, err := getHttpsCertFromContext(context)
	if err != nil {
		return err
	}

	if httpsCert.IsSelfManaged {
		return fmt.Errorf("for selfManaged certs, use /upload instead")
	}

	httpsCert, err = h.Builder(context).CreateAutoManagedHttpsCert(httpsCert)
	if err != nil {
		return err
	}

	return context.JSON(201, httpsCert)
}

func (h *ApiHandler) handleUploadHttpsCert(context echo.Context) error {
	httpsCert, err := getHttpsCertFromContext(context)
	if err != nil {
		return err
	}

	if !httpsCert.IsSelfManaged {
		return fmt.Errorf("can only upload selfManaged certs")
	}

	httpsCert, err = h.Builder(context).CreateSelfManagedHttpsCert(httpsCert)
	if err != nil {
		return err
	}

	return context.JSON(201, httpsCert)
}

func (h *ApiHandler) handleUpdateHttpsCert(context echo.Context) error {
	httpsCert, err := getHttpsCertFromContext(context)
	if err != nil {
		return err
	}

	if httpsCert.IsSelfManaged {
		httpsCert, err = h.Builder(context).UpdateSelfManagedCert(httpsCert)
		if err != nil {
			return err
		}
	} else {
		httpsCert, err = h.Builder(context).UpdateAutoManagedCert(httpsCert)
		if err != nil {
			return err
		}
	}

	return context.JSON(200, httpsCert)
}

func (h *ApiHandler) handleDeleteHttpsCert(c echo.Context) error {
	err := h.Builder(c).DeleteHttpsCert(c.Param("name"))
	if err != nil {
		return err
	}
	return c.NoContent(200)
}

func getHttpsCertFromContext(c echo.Context) (resources.HttpsCert, error) {
	var httpsCert resources.HttpsCert

	if err := c.Bind(&httpsCert); err != nil {
		return resources.HttpsCert{}, err
	}

	return httpsCert, nil
}
