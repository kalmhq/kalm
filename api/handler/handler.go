package handler

import (
	"github.com/kalmhq/kalm/api/client"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
	"github.com/sirupsen/logrus"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/fields"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/client-go/kubernetes"
)

var (
	ListAll = v1.ListOptions{
		LabelSelector: labels.Everything().String(),
		FieldSelector: fields.Everything().String(),
	}
)

type ApiHandler struct {
	clientManager *client.ClientManager
	logger        *logrus.Logger
}

type H map[string]interface{}

func (h *ApiHandler) Install(e *echo.Echo) {
	// liveness readiness probes
	e.GET("/ping", handlePing)

	e.POST("/webhook/components", h.handleDeployWebhookCall)

	// login
	e.POST("/login/token", h.handleValidateToken)
	e.GET("/login/status", h.handleLoginStatus)

	// original resources routes
	gV1 := e.Group("/v1", h.AuthClientMiddleware)
	gV1.GET("/persistentvolumes", h.handleGetPVs)

	gv1Alpha1 := e.Group("/v1alpha1")
	gv1Alpha1.GET("/logs", h.logWebsocketHandler)
	gv1Alpha1.GET("/exec", h.execWebsocketHandler)

	gv1Alpha1WithAuth := gv1Alpha1.Group("", h.AuthClientMiddleware)
	gv1Alpha1WithAuth.GET("/cluster", h.handleClusterInfo)
	gv1Alpha1WithAuth.GET("/applications", h.handleGetApplications)
	gv1Alpha1WithAuth.POST("/applications", h.handleCreateApplication)
	gv1Alpha1WithAuth.GET("/applications/:name", h.handleGetApplicationDetails)
	gv1Alpha1WithAuth.PUT("/applications/:name", h.handleUpdateApplication)
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

	gv1Alpha1WithAuth.GET("/httpscerts", h.handleGetHttpsCerts)
	gv1Alpha1WithAuth.POST("/httpscerts", h.handleCreateHttpsCert)
	gv1Alpha1WithAuth.POST("/httpscerts/upload", h.handleUploadHttpsCert)
	gv1Alpha1WithAuth.PUT("/httpscerts/:name", h.handleUpdateHttpsCert)
	gv1Alpha1WithAuth.DELETE("/httpscerts/:name", h.handleDeleteHttpsCert)

	gv1Alpha1WithAuth.GET("/storageclasses", h.handleListStorageClasses)

	gv1Alpha1WithAuth.GET("/volumes", h.handleListVolumes)
	gv1Alpha1WithAuth.DELETE("/volumes/:namespace/:name", h.handleDeletePVC)
	gv1Alpha1WithAuth.GET("/volumes/available/simple-workload", h.handleAvailableVolsForSimpleWorkload)
	gv1Alpha1WithAuth.GET("/volumes/available/sts/:namespace", h.handleAvailableVolsForSts)

	gv1Alpha1WithAuth.GET("/deploykeys", h.handleListDeployKeys)
	gv1Alpha1WithAuth.POST("/deploykeys", h.handleCreateDeployKey)
	gv1Alpha1WithAuth.DELETE("/deploykeys", h.handleDeleteDeployKey)

	gv1Alpha1WithAuth.GET("/sso", h.handleListSSOConfig)
	gv1Alpha1WithAuth.DELETE("/sso", h.handleDeleteSSOConfig)
	gv1Alpha1WithAuth.PUT("/sso", h.handleUpdateSSOConfig)
	gv1Alpha1WithAuth.POST("/sso", h.handleCreateSSOConfig)

	gv1Alpha1WithAuth.GET("/protectedendpoints", h.handleListProtectedEndpoints)
	gv1Alpha1WithAuth.DELETE("/protectedendpoints", h.handleDeleteProtectedEndpoints)
	gv1Alpha1WithAuth.POST("/protectedendpoints", h.handleCreateProtectedEndpoints)
	gv1Alpha1WithAuth.PUT("/protectedendpoints", h.handleUpdateProtectedEndpoints)
}

// use user token and permission
func (h *ApiHandler) Builder(c echo.Context) *resources.Builder {
	k8sClient := getK8sClient(c)
	k8sClientConfig := getK8sClientConfig(c)
	return resources.NewBuilder(k8sClient, k8sClientConfig, h.logger)
}

// use server account name permission
func (h *ApiHandler) KalmBuilder() *resources.Builder {
	cfg := h.clientManager.ClusterConfig

	k8sClient, err := kubernetes.NewForConfig(cfg)

	if err != nil {
		h.logger.Error("Can't get k8s Client")
		return nil
	}

	return resources.NewBuilder(k8sClient, cfg, h.logger)
}

func NewApiHandler(clientManager *client.ClientManager) *ApiHandler {
	return &ApiHandler{
		clientManager: clientManager,
		logger:        logrus.New(),
	}
}
