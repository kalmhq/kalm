package handler

import (
	"net/http"

	"github.com/kapp-staging/kapp/api/auth"
	"github.com/kapp-staging/kapp/api/client"
	"github.com/labstack/echo/v4"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/fields"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/metrics/pkg/client/clientset/versioned"
)

var (
	listAll = v1.ListOptions{
		LabelSelector: labels.Everything().String(),
		FieldSelector: fields.Everything().String(),
	}
)

type ApiHandler struct {
	clientManager *client.ClientManager
}

type H map[string]interface{}

func (h *ApiHandler) Install(e *echo.Echo) {
	// permission routes
	e.POST("/login", h.handlerLogin)

	// original resources routes
	gV1 := e.Group("/v1", h.AuthClientMiddleware)
	gV1.GET("/deployments", h.handleGetDeployments)
	gV1.GET("/nodes", h.handleGetNodes)
	gV1.GET("/nodes/metrics", h.handleGetNodeMetrics)
	gV1.GET("/persistentvolumes", h.handleGetPVs)

	// kapp resources
	gV1.GET("/componenttemplates", h.handleGetComponentTemplates)
	gV1.POST("/componenttemplates", h.handleCreateComponentTemplate)
	gV1.PUT("/componenttemplates/:name", h.handleUpdateComponentTemplate)
	gV1.DELETE("/componenttemplates/:name", h.handleDeleteComponentTemplate)

	gV1.GET("/dependencies", h.handleGetDependencies)

	gV1.GET("/applications", h.handleGetApplications)
	gV1.GET("/applications/:namespace", h.handleGetApplications)
	gV1.POST("/applications/:namespace", h.handleCreateApplication)
	gV1.PUT("/applications/:namespace/:name", h.handleUpdateApplication)
	gV1.DELETE("/applications/:namespace/:name", h.handleDeleteApplication)

	gV1.GET("/files", h.handleGetFiles)
	gV1.POST("/files", h.handleCreateFile)
	gV1.PUT("/files/:name", h.handleUpdateFile)
	gV1.DELETE("/files/:name", h.handleDeleteFile)
}

func (h *ApiHandler) handlerLogin(c echo.Context) error {
	authInfo, err := auth.GetAuthInfo(c)
	if err != nil {
		return err
	}
	err = h.clientManager.IsAuthInfoWorking(authInfo)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, H{"ok": true})
}

func (h *ApiHandler) handleGetDeployments(c echo.Context) error {
	k8sClient := getK8sClient(c)
	list, err := k8sClient.AppsV1().Deployments("").List(listAll)
	if err != nil {
		return err
	}
	return c.JSON(200, list)
}

func (h *ApiHandler) handleGetPVs(c echo.Context) error {
	k8sClient := getK8sClient(c)
	list, err := k8sClient.CoreV1().PersistentVolumes().List(listAll)
	if err != nil {
		return err
	}
	return c.JSON(200, list)
}

func (h *ApiHandler) handleGetNodes(c echo.Context) error {
	k8sClient := getK8sClient(c)
	list, err := k8sClient.CoreV1().Nodes().List(listAll)
	if err != nil {
		return err
	}
	return c.JSON(200, list)
}

func (h *ApiHandler) handleGetNodeMetrics(c echo.Context) error {
	clientConfig := getK8sClientConfig(c)
	k8sMetricClient, err := versioned.NewForConfig(clientConfig)

	if err != nil {
		return err
	}

	nodeMetrics, err := k8sMetricClient.MetricsV1beta1().NodeMetricses().List(listAll)
	if err != nil {
		return err
	}

	return c.JSON(200, nodeMetrics)
}

func (h *ApiHandler) handleGetApplications(c echo.Context) error {
	k8sClient := getK8sClient(c)
	namespace := c.Param("namespace")

	var path string

	if namespace == "" {
		path = "/apis/core.kapp.dev/v1alpha1/applications"
	} else {
		path = "/apis/core.kapp.dev/v1alpha1/namespaces/" + namespace + "/applications"
	}

	res, err := k8sClient.RESTClient().Get().AbsPath(path).DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleCreateApplication(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Post().Body(c.Request().Body).AbsPath("/apis/core.kapp.dev/v1alpha1/namespaces/" + c.Param("namespace") + "/applications").DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleUpdateApplication(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Put().Body(c.Request().Body).AbsPath("/apis/core.kapp.dev/v1alpha1/namespaces/" + c.Param("namespace") + "/applications/" + c.Param("name")).DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleDeleteApplication(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Delete().AbsPath("/apis/core.kapp.dev/v1alpha1/namespaces/" + c.Param("namespace") + "/applications/" + c.Param("name")).DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleGetComponentTemplates(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Get().AbsPath("/apis/core.kapp.dev/v1alpha1/componenttemplates").DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleCreateComponentTemplate(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Post().Body(c.Request().Body).AbsPath("/apis/core.kapp.dev/v1alpha1/componenttemplates").DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleUpdateComponentTemplate(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Put().Body(c.Request().Body).AbsPath("/apis/core.kapp.dev/v1alpha1/componenttemplates/" + c.Param("name")).DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleDeleteComponentTemplate(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Delete().AbsPath("/apis/core.kapp.dev/v1alpha1/componenttemplates/" + c.Param("name")).DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleGetDependencies(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Get().AbsPath("/apis/core.kapp.dev/v1alpha1/dependencies").DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleGetFiles(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Get().AbsPath("/apis/core.kapp.dev/v1alpha1/namespaces/default/files").DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleCreateFile(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Post().Body(c.Request().Body).AbsPath("/apis/core.kapp.dev/v1alpha1/namespaces/default/files").DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleUpdateFile(c echo.Context) error {
	k8sClient := getK8sClient(c)

	res, err := k8sClient.RESTClient().Put().Body(c.Request().Body).AbsPath("/apis/core.kapp.dev/v1alpha1/namespaces/default/files/" + c.Param("name")).DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleDeleteFile(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Delete().AbsPath("/apis/core.kapp.dev/v1alpha1/namespaces/default/files/" + c.Param("name")).DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func NewApiHandler(clientManager *client.ClientManager) *ApiHandler {
	return &ApiHandler{
		clientManager: clientManager,
	}
}
