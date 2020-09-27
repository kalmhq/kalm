package handler

import (
	"github.com/go-logr/logr"
	"github.com/kalmhq/kalm/api/client"
	"github.com/kalmhq/kalm/api/log"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/api/ws"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/rand"
)

type ApiHandler struct {
	resourceManager *resources.ResourceManager
	clientManager   client.ClientManager
	logger          logr.Logger
}

type H map[string]interface{}

func (h *ApiHandler) InstallAdminRoutes(e *echo.Echo) {

	e.GET("/routes", func(c echo.Context) error {
		return c.JSON(200, e.Routes())
	})

	e.POST("/temporary_cluster_owner_access_tokens", func(c echo.Context) error {
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
	}, h.GetCurrentUserMiddleware, h.RequireUserMiddleware)
}

func (h *ApiHandler) InstallWebhookRoutes(e *echo.Echo) {
	e.GET("/ping", handlePing)
	e.POST("/webhook/components", h.handleDeployWebhookCall)
}

func (h *ApiHandler) InstallMainRoutes(e *echo.Echo) {
	e.GET("/ping", handlePing)
	e.GET("/policies", h.handlePolicies, h.GetCurrentUserMiddleware, h.RequireUserMiddleware)

	// watch
	wsHandler := ws.NewWsHandler(h.clientManager)
	e.GET("/ws", wsHandler.Serve)

	// login
	e.POST("/login/token", h.handleValidateToken)
	e.GET("/login/status", h.handleLoginStatus, h.GetCurrentUserMiddleware, h.RequireUserMiddleware)

	// original resources routes
	gV1 := e.Group("/v1", h.GetCurrentUserMiddleware, h.RequireUserMiddleware)
	gV1.GET("/persistentvolumes", h.handleGetPVs)

	gv1Alpha1 := e.Group("/v1alpha1")
	gv1Alpha1.GET("/logs", h.logWebsocketHandler)
	gv1Alpha1.GET("/exec", h.execWebsocketHandler)

	gv1Alpha1WithAuth := gv1Alpha1.Group("", h.GetCurrentUserMiddleware, h.RequireUserMiddleware)

	// initialize the cluster
	gv1Alpha1WithAuth.POST("/initialize", h.handleInitializeCluster)
	gv1Alpha1WithAuth.POST("/reset", h.handleResetCluster)

	gv1Alpha1WithAuth.GET("/cluster", h.handleClusterInfo)
	gv1Alpha1WithAuth.GET("/applications", h.handleGetApplications)
	gv1Alpha1WithAuth.POST("/applications", h.handleCreateApplication)
	gv1Alpha1WithAuth.GET("/applications/:name", h.handleGetApplicationDetails)
	gv1Alpha1WithAuth.DELETE("/applications/:name", h.handleDeleteApplication)

	gv1Alpha1WithAuth.GET("/services", h.handleListClusterServices)

	gv1Alpha1WithAuth.GET("/componentplugins", h.handleListComponentPlugins)

	gv1Alpha1WithAuth.GET("/applications/:applicationName/components", h.handleListComponents)
	gv1Alpha1WithAuth.GET("/applications/:applicationName/components/:name", h.handleGetComponent)
	gv1Alpha1WithAuth.PUT("/applications/:applicationName/components/:name", h.handleUpdateComponent)
	gv1Alpha1WithAuth.DELETE("/applications/:applicationName/components/:name", h.handleDeleteComponent)
	gv1Alpha1WithAuth.POST("/applications/:applicationName/components", h.handleCreateComponent)

	gv1Alpha1WithAuth.GET("/registries", h.handleListRegistries)
	gv1Alpha1WithAuth.GET("/registries/:name", h.handleGetRegistry)
	gv1Alpha1WithAuth.PUT("/registries/:name", h.handleUpdateRegistry)
	gv1Alpha1WithAuth.POST("/registries", h.handleCreateRegistry)
	gv1Alpha1WithAuth.DELETE("/registries/:name", h.handleDeleteRegistry)

	gv1Alpha1WithAuth.DELETE("/pods/:namespace/:name", h.handleDeletePod)

	gv1Alpha1WithAuth.GET("/rolebindings", h.handleListRoleBindings)
	gv1Alpha1WithAuth.POST("/rolebindings", h.handleCreateRoleBinding)
	gv1Alpha1WithAuth.PUT("/rolebindings", h.handleUpdateRoleBinding)
	gv1Alpha1WithAuth.DELETE("/rolebindings/:namespace/:name", h.handleDeleteRoleBinding)

	gv1Alpha1WithAuth.GET("/serviceaccounts/:name", h.handleGetServiceAccount)

	gv1Alpha1WithAuth.GET("/nodes", h.handleListNodes)
	gv1Alpha1WithAuth.POST("/nodes/:name/cordon", h.handleCordonNode)
	gv1Alpha1WithAuth.POST("/nodes/:name/uncordon", h.handleUncordonNode)

	gv1Alpha1WithAuth.GET("/httproutes", h.handleListAllRoutes)
	gv1Alpha1WithAuth.GET("/httproutes/:namespace", h.handleListRoutes)
	gv1Alpha1WithAuth.POST("/httproutes/:namespace", h.handleCreateRoute)
	gv1Alpha1WithAuth.PUT("/httproutes/:namespace/:name", h.handleUpdateRoute)
	gv1Alpha1WithAuth.DELETE("/httproutes/:namespace/:name", h.handleDeleteRoute)

	gv1Alpha1WithAuth.GET("/httpscertissuers", h.handleGetHttpsCertIssuer)
	gv1Alpha1WithAuth.POST("/httpscertissuers", h.handleCreateHttpsCertIssuer)
	gv1Alpha1WithAuth.PUT("/httpscertissuers/:name", h.handleUpdateHttpsCertIssuer)
	gv1Alpha1WithAuth.DELETE("/httpscertissuers/:name", h.handleDeleteHttpsCertIssuer)

	gv1Alpha1WithAuth.GET("/httpscerts", h.handleListHttpsCerts)
	gv1Alpha1WithAuth.GET("/httpscerts/:name", h.handleGetHttpsCert)
	gv1Alpha1WithAuth.POST("/httpscerts", h.handleCreateHttpsCert)
	gv1Alpha1WithAuth.POST("/httpscerts/upload", h.handleUploadHttpsCert)
	gv1Alpha1WithAuth.PUT("/httpscerts/:name", h.handleUpdateHttpsCert)
	gv1Alpha1WithAuth.DELETE("/httpscerts/:name", h.handleDeleteHttpsCert)

	gv1Alpha1WithAuth.GET("/storageclasses", h.handleListStorageClasses)

	gv1Alpha1WithAuth.GET("/volumes", h.handleListVolumes)
	gv1Alpha1WithAuth.DELETE("/volumes/:namespace/:name", h.handleDeletePVC)

	// deprecated
	gv1Alpha1WithAuth.GET("/volumes/available/simple-workload", h.handleAvailableVolsForSimpleWorkload)
	gv1Alpha1WithAuth.GET("/volumes/available/simple-workload/:namespace", h.handleAvailableVolsForSimpleWorkload)

	gv1Alpha1WithAuth.GET("/volumes/available/sts/:namespace", h.handleAvailableVolsForSts)

	// general access token handler
	gv1Alpha1WithAuth.GET("/access_tokens", h.handleListAccessTokens)
	gv1Alpha1WithAuth.POST("/access_tokens", h.handleCreateAccessToken)
	gv1Alpha1WithAuth.DELETE("/access_tokens", h.handleDeleteAccessToken)

	// deploy access token is just access token that only has update component permissions
	gv1Alpha1WithAuth.GET("/deploy_access_tokens", h.handleListDeployAccessTokens)
	gv1Alpha1WithAuth.POST("/deploy_access_tokens", h.handleCreateDeployAccessToken)
	gv1Alpha1WithAuth.DELETE("/deploy_access_tokens", h.handleDeleteAccessToken)

	gv1Alpha1WithAuth.GET("/sso", h.handleListSSOConfig)
	gv1Alpha1WithAuth.DELETE("/sso", h.handleDeleteSSOConfig)
	gv1Alpha1WithAuth.PUT("/sso", h.handleUpdateSSOConfig)
	gv1Alpha1WithAuth.POST("/sso", h.handleCreateSSOConfig)

	gv1Alpha1WithAuth.GET("/protectedendpoints", h.handleListProtectedEndpoints)
	gv1Alpha1WithAuth.DELETE("/protectedendpoints", h.handleDeleteProtectedEndpoints)
	gv1Alpha1WithAuth.POST("/protectedendpoints", h.handleCreateProtectedEndpoints)
	gv1Alpha1WithAuth.PUT("/protectedendpoints", h.handleUpdateProtectedEndpoints)

	gv1Alpha1WithAuth.POST("/acmeserver", h.handleCreateACMEServer)
	gv1Alpha1WithAuth.GET("/acmeserver", h.handleGetACMEServer)
	gv1Alpha1WithAuth.PUT("/acmeserver", h.handleUpdateACMEServer)
	gv1Alpha1WithAuth.DELETE("/acmeserver", h.handleDeleteACMEServer)

	gv1Alpha1WithAuth.GET("/settings", h.handleListSettings)
}

func NewApiHandler(clientManager client.ClientManager) *ApiHandler {
	return &ApiHandler{
		clientManager:   clientManager,
		logger:          log.DefaultLogger(),
		resourceManager: resources.NewResourceManager(clientManager.GetDefaultClusterConfig(), log.DefaultLogger()),
	}
}
