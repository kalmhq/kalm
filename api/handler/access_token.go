package handler

import (
	"github.com/kalmhq/kalm/api/errors"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	"k8s.io/apimachinery/pkg/util/rand"
)

// installer

func (h *ApiHandler) InstallAccessTokensHandlers(e *echo.Group) {
	e.GET("/access_tokens", h.handleListAccessTokens)
	e.POST("/access_tokens", h.handleCreateAccessToken)
	e.DELETE("/access_tokens", h.handleDeleteAccessToken)
}

// handlers

func (h *ApiHandler) handleListAccessTokens(c echo.Context) error {
	tokens, err := h.resourceManager.GetAccessTokens()
	tokens = h.filterAuthorizedAccessTokens(c, tokens)

	if err != nil {
		return err
	}

	return c.JSON(200, tokens)
}

func (h *ApiHandler) handleCreateAccessToken(c echo.Context) error {
	currentUser := getCurrentUser(c)
	accessToken, err := bindAccessTokenFromRequestBody(c)

	if err != nil {
		return err
	}

	// Set sensitive fields
	accessToken.Token = rand.String(128)
	accessToken.Creator = currentUser.Name
	accessToken.Name = v1alpha1.GetAccessTokenNameFromToken(accessToken.Token)

	if !h.clientManager.PermissionsGreaterThanOrEqualToAccessToken(currentUser, accessToken) {
		return resources.InsufficientPermissionsError
	}

	accessToken, err = h.resourceManager.CreateAccessToken(accessToken)

	if err != nil {
		return err
	}

	return c.JSON(201, accessToken)
}

func (h *ApiHandler) handleDeleteAccessToken(c echo.Context) error {
	currentUser := getCurrentUser(c)

	accessToken, err := bindAccessTokenFromRequestBody(c)

	if err != nil {
		return err
	}

	tokens, err := h.resourceManager.GetAccessTokens(
		hasName(accessToken.Name),
		limitOne(),
	)

	if err != nil {
		return err
	}

	if len(tokens) == 0 {
		return errors.NewNotFound("")
	}

	token := tokens[0]

	if !h.clientManager.PermissionsGreaterThanOrEqualToAccessToken(currentUser, &resources.AccessToken{
		Name: token.Name, AccessTokenSpec: token.AccessTokenSpec,
	}) {
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
		if !h.clientManager.PermissionsGreaterThanOrEqualToAccessToken(getCurrentUser(c), records[i]) {
			records[l-1], records[i] = records[i], records[l-1]
			i--
			l--
		}
	}

	return records[:l]
}
