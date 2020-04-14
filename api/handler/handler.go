package handler

import (
	"github.com/kapp-staging/kapp/api/client"
	"github.com/labstack/echo/v4"
	"github.com/sirupsen/logrus"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/fields"
	"k8s.io/apimachinery/pkg/labels"
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

	// login
	e.POST("/login/token", h.handleValidateToken)
	e.GET("/login/status", h.handleLoginStatus)

	// original resources routes
	gV1 := e.Group("/v1", h.AuthClientMiddleware)
	gV1.GET("/persistentvolumes", h.handleGetPVs)

	gV1.GET("/dependencies", h.handleGetDependencies)
	gV1.GET("/dependencies/available", h.handleGetAvailableDependencies)

	gv1Alpha1 := e.Group("/v1alpha1")
	gv1Alpha1.GET("/logs", h.logWebsocketHandler)
	gv1Alpha1.GET("/exec", h.execWebsocketHandler)

	gv1Alpha1WithAuth := gv1Alpha1.Group("", h.AuthClientMiddleware)
	gv1Alpha1WithAuth.GET("/applications", h.handleGetApplications)
	gv1Alpha1WithAuth.GET("/applications/:namespace", h.handleGetApplications)
	gv1Alpha1WithAuth.GET("/applications/:namespace/:name", h.handleGetApplicationDetails)
	gv1Alpha1WithAuth.PUT("/applications/:namespace/:name", h.handleUpdateApplication)
	gv1Alpha1WithAuth.DELETE("/applications/:namespace/:name", h.handleDeleteApplication)
	gv1Alpha1WithAuth.POST("/applications/:namespace", h.handleCreateApplication)

	gv1Alpha1WithAuth.GET("/componenttemplates", h.handleGetComponentTemplates)
	gv1Alpha1WithAuth.POST("/componenttemplates", h.handleCreateComponentTemplate)
	gv1Alpha1WithAuth.PUT("/componenttemplates/:name", h.handleUpdateComponentTemplate)
	gv1Alpha1WithAuth.DELETE("/componenttemplates/:name", h.handleDeleteComponentTemplate)

	gv1Alpha1WithAuth.GET("/files/:namespace", h.handleListFiles)
	gv1Alpha1WithAuth.POST("/files/:namespace", h.handleCreateFile)
	gv1Alpha1WithAuth.PUT("/files/:namespace", h.handleUpdateFile)
	gv1Alpha1WithAuth.PUT("/files/:namespace/move", h.handleMoveFile)
	gv1Alpha1WithAuth.DELETE("/files/:namespace", h.handleDeleteFile)

	gv1Alpha1WithAuth.DELETE("/pods/:namespace/:name", h.handleDeletePod)

	gv1Alpha1WithAuth.GET("/namespaces", h.handleListNamespaces)
	gv1Alpha1WithAuth.POST("/namespaces/:name", h.handleCreateNamespace)
	gv1Alpha1WithAuth.DELETE("/namespaces/:name", h.handleDeleteNamespace)

	gv1Alpha1WithAuth.GET("/rolebindings", h.handleListRoleBindings)
	gv1Alpha1WithAuth.POST("/rolebindings", h.handleCreateRoleBinding)
	gv1Alpha1WithAuth.DELETE("/rolebindings/:namespace/:name", h.handleDeleteRoleBinding)

	gv1Alpha1WithAuth.GET("/serviceaccounts/:name", h.handleGetServiceAccount)

	gv1Alpha1WithAuth.GET("/nodes", h.handleListNodes)
}

func NewApiHandler(clientManager *client.ClientManager) *ApiHandler {
	return &ApiHandler{
		clientManager: clientManager,
		logger:        logrus.New(),
	}
}
