package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/kalmhq/kalm/controller/controllers"
	"github.com/labstack/echo/v4"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (h *ApiHandler) InstallHttpCertIssuerHandlers(e *echo.Group) {
	e.GET("/httpscertissuers", h.handleGetHttpsCertIssuer)
	e.POST("/httpscertissuers", h.handleCreateHttpsCertIssuer)
	e.PUT("/httpscertissuers/:name", h.handleUpdateHttpsCertIssuer)
	e.DELETE("/httpscertissuers/:name", h.handleDeleteHttpsCertIssuer)
}

func (h *ApiHandler) handleGetHttpsCertIssuer(c echo.Context) error {
	h.MustCanManageCluster(getCurrentUser(c))

	httpsCertIssuers, err := h.resourceManager.GetHttpsCertIssuerList()
	if err != nil {
		return err
	}

	return c.JSON(200, httpsCertIssuers)
}

func (h *ApiHandler) handleCreateHttpsCertIssuer(c echo.Context) (err error) {
	h.MustCanManageCluster(getCurrentUser(c))

	httpsCertIssuer, err := getHttpsCertIssuerFromContext(c)
	if err != nil {
		return err
	}

	resource := v1alpha1.HttpsCertIssuer{
		ObjectMeta: v1.ObjectMeta{
			Name: httpsCertIssuer.Name,
		},
		Spec: v1alpha1.HttpsCertIssuerSpec{},
	}

	if httpsCertIssuer.CAForTest != nil {
		resource.Spec.CAForTest = httpsCertIssuer.CAForTest
	}

	if httpsCertIssuer.ACMECloudFlare != nil {

		acmeSecretName := resources.GenerateSecretNameForACME(httpsCertIssuer)
		err := h.resourceManager.ReconcileSecretForIssuer(
			controllers.CertManagerNamespace,
			acmeSecretName,
			httpsCertIssuer.ACMECloudFlare.Secret,
		)

		if err != nil {
			return err
		}

		resource.Spec.ACMECloudFlare = &v1alpha1.ACMECloudFlareIssuer{
			Email:              httpsCertIssuer.ACMECloudFlare.Account,
			APITokenSecretName: acmeSecretName,
		}
	}

	err = h.resourceManager.Create(&resource)
	if err != nil {
		return err
	}

	return c.JSON(201, httpsCertIssuer)
}

func (h *ApiHandler) handleUpdateHttpsCertIssuer(c echo.Context) error {
	h.MustCanManageCluster(getCurrentUser(c))

	httpsCertIssuer, err := getHttpsCertIssuerFromContext(c)
	if err != nil {
		return err
	}

	httpsCertIssuer, err = h.resourceManager.UpdateHttpsCertIssuer(httpsCertIssuer)
	if err != nil {
		return err
	}

	return c.JSON(200, httpsCertIssuer)
}

func (h *ApiHandler) handleDeleteHttpsCertIssuer(c echo.Context) error {
	h.MustCanManageCluster(getCurrentUser(c))

	err := h.resourceManager.DeleteHttpsCertIssuer(c.Param("name"))

	if err != nil {
		return err
	}

	return c.NoContent(200)
}

func getHttpsCertIssuerFromContext(c echo.Context) (resources.HttpsCertIssuer, error) {
	var httpsCertIssuer resources.HttpsCertIssuer
	if err := c.Bind(&httpsCertIssuer); err != nil {
		return resources.HttpsCertIssuer{}, err
	}

	return httpsCertIssuer, nil
}
