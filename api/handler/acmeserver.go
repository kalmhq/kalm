package handler

import (
	"fmt"

	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) InstallACMEServerHandlers(e *echo.Group) {
	//todo only update, no create?
	e.POST("/acmeserver", h.handleUpdateACMEServer)
	e.GET("/acmeserver", h.handleGetACMEServer)
	e.DELETE("/acmeserver", h.handleDeleteACMEServer)
}

func (h *ApiHandler) handleUpdateACMEServer(c echo.Context) error {
	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.NoClusterEditorRoleError
	}

	acmeServer, err := bindACMEServerFromRequestBody(c)

	if err != nil {
		return err
	}

	if acmeServer.ACMEDomain == "" {
		return fmt.Errorf("acmeDomain is blank")
	}

	// ns-<acme-xyz>.<your-domain.com>
	acmeServer.NSDomain = fmt.Sprintf("ns-%s", acmeServer.ACMEDomain)

	acmeServer, err = h.resourceManager.UpdateACMEServer(acmeServer)

	if err != nil {
		return err
	}

	return c.JSON(200, acmeServer)
}

func (h *ApiHandler) handleGetACMEServer(c echo.Context) error {
	if !h.clientManager.CanViewCluster(getCurrentUser(c)) {
		return resources.NoClusterViewerRoleError
	}

	acmeServerResp, err := h.resourceManager.GetACMEServerAsResp()

	if err != nil {
		return err
	}

	return c.JSON(200, acmeServerResp)
}

func (h *ApiHandler) handleDeleteACMEServer(c echo.Context) error {
	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.NoClusterEditorRoleError
	}

	err := h.resourceManager.DeleteACMEServer()

	if err != nil {
		return err
	}

	return c.NoContent(200)
}

func bindACMEServerFromRequestBody(c echo.Context) (*resources.ACMEServer, error) {
	var acmeServer resources.ACMEServer

	if err := c.Bind(&acmeServer); err != nil {
		return nil, err
	}

	return &acmeServer, nil
}
