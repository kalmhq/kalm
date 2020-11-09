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

func (h *ApiHandler) MustCan(user *client.ClientInfo, action string, scope string, object string) {
	if !h.clientManager.Can(user, action, scope, object) {
		panic(&resources.UnauthorizedError{
			Email:  user.Email,
			Groups: user.Groups,
			Tenant: user.Tenant,
			Action: action,
			Scope:  scope,
			Object: object,
		})
	}
}

func (h *ApiHandler) MustCanEdit(user *client.ClientInfo, scope string, object string) {
	h.MustCan(user, "edit", scope, object)
}

func (h *ApiHandler) MustCanView(user *client.ClientInfo, scope string, object string) {
	h.MustCan(user, "view", scope, object)
}

func (h *ApiHandler) MustCanManage(user *client.ClientInfo, scope string, object string) {
	h.MustCan(user, "manage", scope, object)
}

func (h *ApiHandler) MustCanEditCluster(user *client.ClientInfo) {
	h.MustCan(user, "edit", "*/*", "*/*")
}

func (h *ApiHandler) MustCanViewCluster(user *client.ClientInfo) {
	h.MustCan(user, "view", "*/*", "*/*")
}

func (h *ApiHandler) MustCanManageCluster(user *client.ClientInfo) {
	h.MustCan(user, "manage", "*/*", "*/*")
}


