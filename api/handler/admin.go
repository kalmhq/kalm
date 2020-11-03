package handler

import (
	"sort"
	"strings"

	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/rand"
)

type Policies []string

func (a Policies) Len() int { return len(a) }

// The casbin policy roles always begin with "p, " or "g, " (len of 3)
// Sort all policies with actual subject names.
func (a Policies) Less(i, j int) bool { return a[i][3:] < a[j][3:] }
func (a Policies) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }

func (h *ApiHandler) InstallAdminRoutes(e *echo.Echo) {
	g := e.Group("/admin")

	g.GET("/routes", handleApiRoutes)
	g.POST("/temp_account", h.handleCreateTemporaryClusterOwnerAccessTokens, h.GetUserMiddleware, h.RequireUserMiddleware)

	// deprecated
	e.POST("/temporary_cluster_owner_access_token", h.handleCreateTemporaryClusterOwnerAccessTokens, h.GetUserMiddleware, h.RequireUserMiddleware)
}

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

func handleApiRoutes(c echo.Context) error {
	return c.JSON(200, c.Echo().Routes())
}

func (h *ApiHandler) handleCreateTemporaryClusterOwnerAccessTokens(c echo.Context) error {
	token := rand.String(128)

	accessToken := &v1alpha1.AccessToken{
		ObjectMeta: metaV1.ObjectMeta{
			Name: v1alpha1.GetAccessTokenNameFromToken(token),
		},
		Spec: v1alpha1.AccessTokenSpec{
			Token: token,
			Rules: []v1alpha1.AccessTokenRule{
				{
					Verb:      "view",
					Namespace: "*",
					Kind:      "*",
					Name:      "*",
				},
				{
					Verb:      "edit",
					Namespace: "*",
					Kind:      "*",
					Name:      "*",
				},
				{
					Verb:      "manage",
					Namespace: "*",
					Kind:      "*",
					Name:      "*",
				},
			},
			Creator:   getCurrentUser(c).Name,
			ExpiredAt: nil,
		},
	}

	if err := h.resourceManager.Create(accessToken); err != nil {
		return err
	}

	return c.JSON(200, accessToken)
}
