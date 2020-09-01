package handler

import (
	"github.com/labstack/echo/v4"
	"strings"
)

func (h *ApiHandler) handlePolicies(c echo.Context) error {
	policies := h.clientManager.GetRBACEnforcer().GetPolicy()

	var list []string

	for _, ps := range policies {
		list = append(list, strings.Join(ps, ", "))
	}

	return c.String(200, strings.Join(list, "\n"))
}
