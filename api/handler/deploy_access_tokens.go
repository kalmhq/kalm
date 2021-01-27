package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/util/rand"
)

func (h *ApiHandler) InstallDeployAccessTokenHandlers(e *echo.Group) {
	e.GET("/deploy_access_tokens", h.handleListDeployAccessTokens)
	e.POST("/deploy_access_tokens", h.handleCreateDeployAccessToken)
	e.DELETE("/deploy_access_tokens", h.handleDeleteAccessToken)
}

func (h *ApiHandler) handleListDeployAccessTokens(c echo.Context) error {
	keys, err := h.resourceManager.GetDeployAccessTokens()
	keys = h.filterAuthorizedAccessTokens(c, keys)

	if err != nil {
		return err
	}

	return c.JSON(200, keys)
}

func (h *ApiHandler) handleCreateDeployAccessToken(c echo.Context) error {
	currentUser := getCurrentUser(c)

	accessToken, err := bindAccessTokenFromRequestBody(c)
	if err != nil {
		return err
	}

	if !h.clientManager.PermissionsGreaterThanOrEqualToAccessToken(currentUser, accessToken) {
		return resources.InsufficientPermissionsError
	}

	for _, rule := range accessToken.AccessTokenSpec.Rules {
		if rule.Verb != v1alpha1.AccessTokenVerbEdit {
			return errors.NewBadRequest("Only edit verb is allowed for deploy access tokens")
		}

		if rule.Kind != "components" {
			return errors.NewBadRequest("Only 'components' Kind is allowed for deploy access tokens")
		}

		if rule.Namespace != "*" {
			var ns v1.Namespace

			if err := h.resourceManager.Get("", rule.Namespace, &ns); err != nil {
				return err
			}
		}
	}

	// Set sensitive fields
	accessToken.Token = rand.String(128)
	if accessToken.Creator == "" {
		accessToken.Creator = firstNotEmptyStr(currentUser.Name, currentUser.Email)
	}
	accessToken.Name = v1alpha1.GetAccessTokenNameFromToken(accessToken.Token)

	accessToken, err = h.resourceManager.CreateDeployAccessToken(accessToken)
	if err != nil {
		return err
	}

	return c.JSON(201, accessToken)
}

func firstNotEmptyStr(strList ...string) string {
	for _, str := range strList {
		if str != "" {
			return str
		}
	}

	return ""
}
