package handler

import (
	"github.com/labstack/echo/v4"
	"net/http"
)

func (h *ApiHandler) handleDeletePod(c echo.Context) error {
	namespace := c.Param("namespace")
	name := c.Param("name")
	k8sClient := getK8sClient(c)

	err := k8sClient.CoreV1().Pods(namespace).Delete(name, nil)

	if err != nil {
		return err
	}

	return c.NoContent(http.StatusOK)
}
