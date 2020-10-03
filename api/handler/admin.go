package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
	"sort"
	"strings"
)

type Policies []string

func (a Policies) Len() int { return len(a) }

// The casbin policy roles always begin with "p, " or "g, " (len of 3)
// Sort all policies with actual subject names.
func (a Policies) Less(i, j int) bool { return a[i][3:] < a[j][3:] }
func (a Policies) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }

func (h *ApiHandler) handlePolicies(c echo.Context) error {
	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.InsufficientPermissionsError
	}

	policies := h.clientManager.GetRBACEnforcer().GetPolicy()
	groupingPolicies := h.clientManager.GetRBACEnforcer().GetGroupingPolicy()

	var list []string

	for _, ps := range policies {
		list = append(list, "p, "+strings.Join(ps, ", "))
	}

	for _, item := range groupingPolicies {
		list = append(list, "g, "+strings.Join(item, ", "))
	}

	sort.Sort(Policies(list))

	return c.String(200, strings.Join(list, "\n"))
}
