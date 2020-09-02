package handler

import (
	client2 "github.com/kalmhq/kalm/api/client"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
)

func (h *ApiHandler) handleListAccessTokens(c echo.Context) error {
	keys, err := h.resourceManager.GetAccessTokens(c.Param("namespace"))
	keys = h.filterAuthorizedAccessTokens(c, keys)

	if err != nil {
		return err
	}

	return c.JSON(200, keys)
}

func (h *ApiHandler) handleCreateAccessToken(c echo.Context) error {
	accessToken, err := getAccessTokenFromContext(c)

	if err != nil {
		return err
	}

	if !h.permissionsGreaterThanAccessToken(getCurrentUser(c), accessToken.AccessTokenSpec) {
		return resources.InsufficientPermissionsError
	}

	accessToken, err = h.resourceManager.CreateAccessToken(accessToken)
	if err != nil {
		return err
	}

	return c.JSON(201, accessToken)
}

func (h *ApiHandler) handleDeleteAccessToken(c echo.Context) error {
	accessToken, err := getAccessTokenFromContext(c)

	if err != nil {
		return err
	}

	var fetched v1alpha1.AccessToken
	if err := h.resourceManager.Get("", accessToken.Name, &fetched); err != nil {
		return nil
	}

	if !h.permissionsGreaterThanAccessToken(getCurrentUser(c), &fetched.Spec) {
		return resources.InsufficientPermissionsError
	}

	if err := h.resourceManager.DeleteAccessToken(accessToken.Name); err != nil {
		return err
	}

	return c.NoContent(200)
}

func getAccessTokenFromContext(c echo.Context) (*resources.AccessToken, error) {
	var accessToken resources.AccessToken

	if err := c.Bind(&accessToken); err != nil {
		return nil, err
	}

	return &accessToken, nil
}

func (h *ApiHandler) filterAuthorizedAccessTokens(c echo.Context, records []*resources.AccessToken) []*resources.AccessToken {
	l := len(records)

	// select all visible namespaces
	for i := 0; i < l; i++ {
		if !h.permissionsGreaterThanAccessToken(getCurrentUser(c), records[i].AccessTokenSpec) {
			records[l-1], records[i] = records[i], records[l-1]
			i--
			l--
		}
	}

	return records[:l]
}

func (h *ApiHandler) permissionsGreaterThanAccessToken(client *client2.ClientInfo, accessToken *v1alpha1.AccessTokenSpec) bool {
	policies := client2.GetPoliciesFromAccessToken(accessToken)

	for _, policy := range policies {
		if !h.clientManager.Can(client, policy[1], policy[2], policy[3]) {
			return false
		}
	}

	return true
}
