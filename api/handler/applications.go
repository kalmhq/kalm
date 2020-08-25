package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/controllers"
	"github.com/labstack/echo/v4"
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
)

func (h *ApiHandler) handleGetApplications(c echo.Context) error {
	var fetched coreV1.NamespaceList

	err := h.Builder(c).List(&fetched)

	if err != nil {
		return err
	}

	res, err := h.Builder(c).BuildApplicationListResponse(fetched)

	if err != nil {
		return err
	}

	return c.JSON(200, res)
}

func (h *ApiHandler) handleGetApplicationDetails(c echo.Context) error {
	var fetched coreV1.Namespace
	err := h.Builder(c).Get("", c.Param("name"), &fetched)

	if err != nil {
		return err
	}

	res, err := h.Builder(c).BuildApplicationDetails(&fetched)

	if err != nil {
		return err
	}

	return c.JSON(200, res)
}

func (h *ApiHandler) handleCreateApplication(c echo.Context) error {
	ns, err := getKalmNamespaceFromContext(c)

	if err != nil {
		return err
	}

	if err := h.Builder(c).Create(ns); err != nil {
		return err
	}

	res, err := h.Builder(c).BuildApplicationDetails(ns)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, res)
}

func (h *ApiHandler) handleDeleteApplication(c echo.Context) error {
	if err := h.Builder(c).Delete(&coreV1.Namespace{ObjectMeta: metaV1.ObjectMeta{Name: c.Param("name")}}); err != nil {
		return err
	}

	return c.NoContent(http.StatusNoContent)
}

func getKalmNamespaceFromContext(c echo.Context) (*coreV1.Namespace, error) {
	var ns resources.Application

	if err := c.Bind(&ns); err != nil {
		return nil, err
	}

	coreV1Namespace := coreV1.Namespace{
		ObjectMeta: metaV1.ObjectMeta{
			Name: ns.Name,
			Labels: map[string]string{
				controllers.KalmEnableLabelName: controllers.KalmEnableLabelValue,
			},
		},
	}

	return &coreV1Namespace, nil
}
