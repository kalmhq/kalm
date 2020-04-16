package handler

import (
	"github.com/labstack/echo/v4"
)

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
