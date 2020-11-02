package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	"k8s.io/apimachinery/pkg/util/rand"
)

func (h *ApiHandler) InstallAccessTokensHandlers(e *echo.Group) {
	e.GET("/access_tokens", h.handleListAccessTokens)
	e.POST("/access_tokens", h.handleCreateAccessToken)
	e.DELETE("/access_tokens", h.handleDeleteAccessToken)
}

func (h *ApiHandler) handleListAccessTokens(c echo.Context) error {
	currentUser := getCurrentUser(c)

	keys, err := h.resourceManager.GetAccessTokens(
		belongsToTenant(currentUser.Tenant),
	)

	keys = h.filterAuthorizedAccessTokens(c, keys)

	if err != nil {
		return err
	}

	return c.JSON(200, keys)
}

func (h *ApiHandler) handleCreateAccessToken(c echo.Context) error {
	currentUser := getCurrentUser(c)
	accessToken, err := bindAccessTokenFromRequestBody(c)

	if err != nil {
		return err
	}

	if !h.clientManager.PermissionsGreaterThanOrEqualAccessToken(currentUser, accessToken) {
		return resources.InsufficientPermissionsError
	}

	// Set sensitive fields
	accessToken.Token = rand.String(128)
	accessToken.Creator = currentUser.Name
	accessToken.Name = v1alpha1.GetAccessTokenNameFromToken(accessToken.Token)
	accessToken.Tenant = currentUser.Tenant

	accessToken, err = h.resourceManager.CreateAccessToken(accessToken)
	if err != nil {
		return err
	}

	return c.JSON(201, accessToken)
}

func (h *ApiHandler) handleDeleteAccessToken(c echo.Context) error {
	accessToken, err := bindAccessTokenFromRequestBody(c)

	if err != nil {
		return err
	}

	var fetched v1alpha1.AccessToken

	if err := h.resourceManager.Get("", accessToken.Name, &fetched); err != nil {
		return err
	}

	if !h.clientManager.PermissionsGreaterThanOrEqualAccessToken(getCurrentUser(c), &resources.AccessToken{Name: fetched.Name, AccessTokenSpec: &fetched.Spec}) {
		return resources.InsufficientPermissionsError
	}

	if err := h.resourceManager.DeleteAccessToken(accessToken.Name); err != nil {
		return err
	}

	return c.NoContent(200)
}

func bindAccessTokenFromRequestBody(c echo.Context) (*resources.AccessToken, error) {
	var accessToken resources.AccessToken

	if err := c.Bind(&accessToken); err != nil {
		return nil, err
	}

	return &accessToken, nil
}

func (h *ApiHandler) filterAuthorizedAccessTokens(c echo.Context, records []*resources.AccessToken) []*resources.AccessToken {
	l := len(records)

	for i := 0; i < l; i++ {
		if !h.clientManager.PermissionsGreaterThanOrEqualAccessToken(getCurrentUser(c), records[i]) {
			records[l-1], records[i] = records[i], records[l-1]
			i--
			l--
		}
	}

	return records[:l]
}
