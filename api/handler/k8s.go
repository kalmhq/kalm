package handler

import (
	"github.com/kapp-staging/kapp/api/resources"
	"github.com/labstack/echo/v4"
	"k8s.io/metrics/pkg/client/clientset/versioned"
)

// func (h *ApiHandler) handleGetRoles(c echo.Context) error {
// 	k8sClient := getK8sClient(c)
// 	res, err := k8sClient.RESTClient().Get().AbsPath("/apis/rbac.authorization.k8s.io/v1/namespaces/default/roles").DoRaw()

// 	if err != nil {
// 		return err
// 	}

// 	return c.JSONBlob(200, res)
// }

// func (h *ApiHandler) handleGetRoleBindings(c echo.Context) error {
// 	k8sClient := getK8sClient(c)
// 	res, err := k8sClient.RESTClient().Get().AbsPath("/apis/rbac.authorization.k8s.io/v1/namespaces/default/clusterrolebindings").DoRaw()

// 	if err != nil {
// 		return err
// 	}

// 	return c.JSONBlob(200, res)
// }

func (h *ApiHandler) handleGetDeployments(c echo.Context) error {
	k8sClient := getK8sClient(c)
	list, err := k8sClient.AppsV1().Deployments("").List(ListAll)
	if err != nil {
		return err
	}
	return c.JSON(200, list)
}

func (h *ApiHandler) handleGetPVs(c echo.Context) error {
	k8sClient := getK8sClient(c)
	list, err := k8sClient.CoreV1().PersistentVolumes().List(ListAll)
	if err != nil {
		return err
	}
	return c.JSON(200, list)
}

func (h *ApiHandler) handleGetNodes(c echo.Context) error {
	k8sClient := getK8sClient(c)
	list, err := k8sClient.CoreV1().Nodes().List(ListAll)
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

	nodeMetrics, err := k8sMetricClient.MetricsV1beta1().NodeMetricses().List(ListAll)
	if err != nil {
		return err
	}

	return c.JSON(200, nodeMetrics)
}

func (h *ApiHandler) handleGetNodeMetricsNew(c echo.Context) error {
	clientConfig := getK8sClientConfig(c)
	k8sMetricClient, err := versioned.NewForConfig(clientConfig)

	if err != nil {
		return err
	}

	nodeMetrics, err := k8sMetricClient.MetricsV1beta1().NodeMetricses().List(ListAll)
	if err != nil {
		return err
	}

	var nodeNames []string
	for _, n := range nodeMetrics.Items {
		nodeNames = append(nodeNames, n.Name)
	}

	resp := resources.GetFilteredNodeMetrics(nodeNames)
	return c.JSON(200, resp)
}

func (h *ApiHandler) handleGetClusterRoles(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Get().AbsPath("/apis/rbac.authorization.k8s.io/v1/clusterroles").DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleCreateClusterRoles(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Post().Body(c.Request().Body).AbsPath("/apis/rbac.authorization.k8s.io/v1/clusterroles").DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleDeleteClusterRoles(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Delete().AbsPath("/apis/rbac.authorization.k8s.io/v1/clusterroles/" + c.Param("name")).DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleGetClusterRoleBindings(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Get().AbsPath("/apis/rbac.authorization.k8s.io/v1/clusterrolebindings").DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleCreateClusterRoleBindings(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Post().Body(c.Request().Body).AbsPath("/apis/rbac.authorization.k8s.io/v1/clusterrolebindings").DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleDeleteClusterRoleBindings(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Delete().AbsPath("/apis/rbac.authorization.k8s.io/v1/clusterrolebindings/" + c.Param("name")).DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleGetServiceAccounts(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Get().AbsPath("/api/v1/namespaces/default/serviceaccounts").DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleCreateServiceAccounts(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Post().Body(c.Request().Body).AbsPath("/api/v1/namespaces/default/serviceaccounts").DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleDeleteServiceAccounts(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Delete().AbsPath("/api/v1/namespaces/default/serviceaccounts/" + c.Param("name")).DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleGetSecrets(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Get().AbsPath("/api/v1/namespaces/default/secrets").DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleCreateSecrets(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Post().Body(c.Request().Body).AbsPath("/api/v1/namespaces/default/secrets").DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleDeleteSecrets(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Delete().AbsPath("/api/v1/namespaces/default/secrets/" + c.Param("name")).DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleGetSecret(c echo.Context) error {
	k8sClient := getK8sClient(c)

	res, err := k8sClient.RESTClient().Get().AbsPath("/api/v1/namespaces/default/secrets/" + c.Param("name")).DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}
