package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/util/rand"
)

func (h *ApiHandler) handleListDeployAccessTokens(c echo.Context) error {
	keys, err := h.resourceManager.GetDeployAccessTokens()
	keys = h.filterAuthorizedAccessTokens(c, keys)

	if err != nil {
		return err
	}

	return c.JSON(200, keys)
}

func (h *ApiHandler) handleCreateDeployAccessToken(c echo.Context) error {
	accessToken, err := bindAccessTokenFromRequestBody(c)

	if err != nil {
		return err
	}

	if !h.clientManager.PermissionsGreaterThanOrEqualAccessToken(getCurrentUser(c), accessToken) {
		return resources.InsufficientPermissionsError
	}

	for _, rule := range accessToken.AccessTokenSpec.Rules {
		if rule.Verb != v1alpha1.AccessTokenVerbEdit {
			return errors.NewBadRequest("Only edit verb is allowed for deploy access tokens")
		}

		if rule.Kind != "components" {
			return errors.NewBadRequest("Only 'components' Kind is allowed for deploy access tokens")
		}
	}

	// Set sensitive fields
	accessToken.Token = rand.String(128)
	accessToken.Creator = getCurrentUser(c).Name
	accessToken.Name = v1alpha1.GetAccessTokenNameFromToken(accessToken.Token)

	accessToken, err = h.resourceManager.CreateDeployAccessToken(accessToken)
	if err != nil {
		return err
	}

	return c.JSON(201, accessToken)
}
