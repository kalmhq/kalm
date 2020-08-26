package handler

import (
	"fmt"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleCreateACMEServer(c echo.Context) error {
	acmeServer, err := getACMEServerFromContext(c)
	if err != nil {
		return err
	}

	if acmeServer.NSDomain == "" {
		return fmt.Errorf("must set nsDomain")
	}

	if acmeServer.ACMEDomain == "" {
		return fmt.Errorf("must set acmeDomain")
	}

	acmeServer, err = h.Builder(c).CreateACMEServer(acmeServer)
	if err != nil {
		return err
	}

	return c.JSON(201, acmeServer)
}

func (h *ApiHandler) handleGetACMEServer(c echo.Context) error {

	acmeServerResp, err := h.Builder(c).GetACMEServer()
	if err != nil {
		return err
	}

	return c.JSON(200, acmeServerResp)
}

func (h *ApiHandler) handleDeleteACMEServer(c echo.Context) error {

	err := h.Builder(c).DeleteACMEServer()

	if err != nil {
		return err
	}

	return c.NoContent(200)
}

func getACMEServerFromContext(c echo.Context) (resources.ACMEServer, error) {
	var acmeServer resources.ACMEServer

	if err := c.Bind(&acmeServer); err != nil {
		return resources.ACMEServer{}, err
	}

	return acmeServer, nil
}
