package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/kalmhq/kalm/controller/controllers"
	"github.com/labstack/echo/v4"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (h *ApiHandler) handleGetHttpsCertIssuer(c echo.Context) error {

	if !h.clientManager.CanViewCluster(getCurrentUser(c)) {
		return resources.NoClusterViewerRoleError
	}

	httpsCertIssuers, err := h.builder.GetHttpsCertIssuerList()
	if err != nil {
		return err
	}

	return c.JSON(200, httpsCertIssuers)
}

func (h *ApiHandler) handleCreateHttpsCertIssuer(c echo.Context) (err error) {

	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.NoClusterEditorRoleError
	}

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
		err := h.builder.ReconcileSecretForIssuer(
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

	err = h.builder.Create(&resource)
	if err != nil {
		return err
	}

	return c.JSON(201, httpsCertIssuer)
}

func (h *ApiHandler) handleUpdateHttpsCertIssuer(c echo.Context) error {

	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.NoClusterEditorRoleError
	}

	httpsCertIssuer, err := getHttpsCertIssuerFromContext(c)
	if err != nil {
		return err
	}

	httpsCertIssuer, err = h.builder.UpdateHttpsCertIssuer(httpsCertIssuer)
	if err != nil {
		return err
	}

	return c.JSON(200, httpsCertIssuer)
}

func (h *ApiHandler) handleDeleteHttpsCertIssuer(c echo.Context) error {

	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.NoClusterEditorRoleError
	}

	err := h.builder.DeleteHttpsCertIssuer(c.Param("name"))

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
