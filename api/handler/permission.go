package handler

import (
	"github.com/kalmhq/kalm/api/client"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
)

func PermissionPanicRecoverMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) (err error) {
		defer func() {
			if r := recover(); r != nil {
				if er, ok := r.(*resources.UnauthorizedError); ok {
					err = er
				} else {
					panic(r)
				}
			}
		}()

		return next(c)
	}
}

func (h *ApiHandler) MustCan(user *client.ClientInfo, action string, namespace string, object string) {
	if !h.clientManager.Can(user, action, namespace, object) {

		var email string
		if user.Impersonation != "" {
			email = user.Impersonation
		} else {
			email = user.Email
		}

		panic(&resources.UnauthorizedError{
			Email:     email,
			Groups:    user.Groups,
			Action:    action,
			Namespace: namespace,
			Object:    object,
		})
	}
}

func (h *ApiHandler) MustCanEdit(user *client.ClientInfo, namespace string, object string) {
	h.MustCan(user, "edit", namespace, object)
}

func (h *ApiHandler) MustCanView(user *client.ClientInfo, namespace string, object string) {
	h.MustCan(user, "view", namespace, object)
}

func (h *ApiHandler) MustCanManage(user *client.ClientInfo, namespace string, object string) {
	h.MustCan(user, "manage", namespace, object)
}

func (h *ApiHandler) MustCanEditCluster(user *client.ClientInfo) {
	h.MustCan(user, "edit", "*", "*")
}

func (h *ApiHandler) MustCanViewCluster(user *client.ClientInfo) {
	h.MustCan(user, "view", "*", "*")
}

func (h *ApiHandler) MustCanManageCluster(user *client.ClientInfo) {
	h.MustCan(user, "manage", "*", "*")
}
