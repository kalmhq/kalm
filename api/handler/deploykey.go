package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleListDeployKeys(c echo.Context) error {
	keys, err := h.Builder(c).GetDeployKeys(c.Param("namespace"))
	if err != nil {
		return err
	}

	return c.JSON(200, keys)
}

func (h *ApiHandler) handleCreateDeployKey(c echo.Context) error {
	deployKey, err := getDeployKeyFromContext(c)
	if err != nil {
		return err
	}

	deployKey, err = h.Builder(c).CreateDeployKey(deployKey)
	if err != nil {
		return err
	}

	return c.JSON(201, deployKey)
}

func (h *ApiHandler) handleDeleteDeployKey(c echo.Context) error {
	deployKey, err := getDeployKeyFromContext(c)

	if err != nil {
		return err
	}

	if err := h.Builder(c).DeleteDeployKey(deployKey.Name); err != nil {
		return err
	}

	return c.NoContent(200)
}

func getDeployKeyFromContext(c echo.Context) (*resources.DeployKey, error) {
	var deployKey resources.DeployKey

	if err := c.Bind(&deployKey); err != nil {
		return nil, err
	}

	return &deployKey, nil
}
