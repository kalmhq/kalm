package handler

import (
	"github.com/kalmhq/kalm/api/client"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
	"k8s.io/apimachinery/pkg/api/errors"
)

const (
	CURRENT_USER_KEY = "k8sClientConfig"
)

func (h *ApiHandler) RequireUserMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		currentUser := c.Get(CURRENT_USER_KEY).(*client.ClientInfo)

		if currentUser == nil {
			return errors.NewUnauthorized("")
		}

		return next(c)
	}
}

func (h *ApiHandler) GetUserMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		clientInfo, err := h.clientManager.GetClientInfoFromContext(c)

		if err != nil {
			return err
		}

		c.Set(CURRENT_USER_KEY, clientInfo)

		return next(c)
	}
}

func getCurrentUser(c echo.Context) *client.ClientInfo {
	return c.Get(CURRENT_USER_KEY).(*client.ClientInfo)
}

func (h *ApiHandler) requireIsTenantOwner(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		currentUser := getCurrentUser(c)

		if !h.resourceManager.IsATenantOwner(currentUser.Email, currentUser.Tenant) {
			return resources.NotATenantOwnerError
		}

		return next(c)
	}

}
