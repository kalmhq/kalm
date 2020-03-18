package handler

import (
	"github.com/labstack/echo/v4"
	"k8s.io/metrics/pkg/client/clientset/versioned"
)

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
