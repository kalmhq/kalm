package handler

import (
	"k8s.io/metrics/pkg/client/clientset/versioned"
	"github.com/kapp-staging/kapp/api/resources"
	"github.com/labstack/echo/v4"
)

func (h*ApiHandler) handleListNodes(c echo.Context) error {
	res, err := resources.ListNodes(getK8sClient(c))

	if err != nil {
		return err
	}

	return c.JSON(200, res)
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

	var nodeNames []string
	for _, n := range nodeMetrics.Items {
		nodeNames = append(nodeNames, n.Name)
	}

	resp := resources.GetFilteredNodeMetrics(nodeNames)
	return c.JSON(200, resp)
}