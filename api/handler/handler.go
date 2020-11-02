package handler

import (
	"github.com/kalmhq/kalm/api/client"
	"github.com/kalmhq/kalm/api/log"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/api/ws"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

type ApiHandler struct {
	resourceManager *resources.ResourceManager
	clientManager   client.ClientManager
	logger          *zap.Logger
}

func (h *ApiHandler) InstallWebhookRoutes(e *echo.Echo) {
	e.GET("/ping", handlePing)
	e.POST("/webhook/components", h.handleDeployWebhookCall)
}

func (h *ApiHandler) InstallMainRoutes(e *echo.Echo) {
	e.GET("/ping", handlePing)
	e.GET("/policies", h.handlePolicies, h.GetUserMiddleware, h.RequireUserMiddleware)

	// watch
	wsHandler := ws.NewWsHandler(h.clientManager)
	e.GET("/ws", wsHandler.Serve)

	// login
	e.POST("/login/token", h.handleValidateToken)
	e.GET("/login/status", h.handleLoginStatus, h.GetUserMiddleware, h.RequireUserMiddleware)

	// original resources routes
	gV1 := e.Group("/v1", h.GetUserMiddleware, h.RequireUserMiddleware)
	gV1.GET("/persistentvolumes", h.handleGetPVs)

	gv1Alpha1 := e.Group("/v1alpha1")
	gv1Alpha1.GET("/logs", h.logWebsocketHandler)
	gv1Alpha1.GET("/exec", h.execWebsocketHandler)

	gv1Alpha1WithAuth := gv1Alpha1.Group("", h.GetUserMiddleware, h.RequireUserMiddleware)

	// initialize the cluster
	gv1Alpha1WithAuth.POST("/initialize", h.handleInitializeCluster)
	gv1Alpha1WithAuth.POST("/reset", h.handleResetCluster)

	gv1Alpha1WithAuth.GET("/cluster", h.handleClusterInfo)

	gv1Alpha1WithAuth.GET("/loadbalancers", h.handleLoadBalancers)

	h.InstallApplicationsHandlers(gv1Alpha1WithAuth)

	gv1Alpha1WithAuth.GET("/services", h.handleListClusterServices)

	gv1Alpha1WithAuth.GET("/componentplugins", h.handleListComponentPlugins)

	gv1Alpha1WithAuth.GET("/applications/:applicationName/components", h.handleListComponents)
	gv1Alpha1WithAuth.GET("/applications/:applicationName/components/:name", h.handleGetComponent)
	gv1Alpha1WithAuth.PUT("/applications/:applicationName/components/:name", h.handleUpdateComponent)
	gv1Alpha1WithAuth.DELETE("/applications/:applicationName/components/:name", h.handleDeleteComponent)
	gv1Alpha1WithAuth.POST("/applications/:applicationName/components", h.handleCreateComponent)

	h.InstallRegistriesHandlers(gv1Alpha1WithAuth)

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

	h.InstallHttpsCertsHandlers(gv1Alpha1WithAuth)

	gv1Alpha1WithAuth.GET("/storageclasses", h.handleListStorageClasses)

	gv1Alpha1WithAuth.GET("/volumes", h.handleListVolumes)
	gv1Alpha1WithAuth.DELETE("/volumes/:namespace/:name", h.handleDeletePVC)

	// deprecated
	gv1Alpha1WithAuth.GET("/volumes/available/simple-workload", h.handleAvailableVolsForSimpleWorkload)
	gv1Alpha1WithAuth.GET("/volumes/available/simple-workload/:namespace", h.handleAvailableVolsForSimpleWorkload)
	gv1Alpha1WithAuth.GET("/volumes/available/sts/:namespace", h.handleAvailableVolsForSts)

	// general access token handler
	h.InstallAccessTokensHandlers(gv1Alpha1WithAuth)

	// deploy access token is just access token that only has update component permissions
	gv1Alpha1WithAuth.GET("/deploy_access_tokens", h.handleListDeployAccessTokens)
	gv1Alpha1WithAuth.POST("/deploy_access_tokens", h.handleCreateDeployAccessToken)
	gv1Alpha1WithAuth.DELETE("/deploy_access_tokens", h.handleDeleteAccessToken)

	gv1Alpha1WithAuth.GET("/sso", h.handleGetSSOConfig)
	gv1Alpha1WithAuth.DELETE("/sso", h.handleDeleteSSOConfig)
	gv1Alpha1WithAuth.PUT("/sso", h.handleUpdateSSOConfig)
	gv1Alpha1WithAuth.POST("/sso", h.handleCreateSSOConfig)
	gv1Alpha1WithAuth.DELETE("/sso/temporary_admin_user", h.handleDeleteTemporaryUser)

	gv1Alpha1WithAuth.GET("/protectedendpoints", h.handleListProtectedEndpoints)
	gv1Alpha1WithAuth.DELETE("/protectedendpoints", h.handleDeleteProtectedEndpoints)
	gv1Alpha1WithAuth.POST("/protectedendpoints", h.handleCreateProtectedEndpoints)
	gv1Alpha1WithAuth.PUT("/protectedendpoints", h.handleUpdateProtectedEndpoints)

	h.InstallACMEServerHandlers(gv1Alpha1WithAuth)

	gv1Alpha1WithAuth.GET("/settings", h.handleListSettings)

	gv1Alpha1WithAuth.GET("/tenants", h.handleListTenants)                // Get all virtual clusters info
	gv1Alpha1WithAuth.GET("/tenants/:name", h.handleGetTenant)            // get single virtual cluster info
	gv1Alpha1WithAuth.POST("/tenants", h.handleCreateTenant)              // Create virtual cluster
	gv1Alpha1WithAuth.POST("/tenants/:name/pause", h.handlePauseTenant)   // Pause virtual cluster
	gv1Alpha1WithAuth.POST("/tenants/:name/resume", h.handleResumeTenant) // Resume virtual cluster
	gv1Alpha1WithAuth.PUT("/tenants/:name", h.handleUpdateTenant)         // update virtual cluster billing plan
	gv1Alpha1WithAuth.DELETE("/tenants/:name", h.handleDeleteTenant)      // internal
}

func NewApiHandler(clientManager client.ClientManager) *ApiHandler {
	return &ApiHandler{
		clientManager:   clientManager,
		logger:          log.DefaultLogger(),
		resourceManager: resources.NewResourceManager(clientManager.GetDefaultClusterConfig(), log.DefaultLogger()),
	}
}
