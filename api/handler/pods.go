package handler

import (
	"github.com/labstack/echo/v4"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
)

func (h *ApiHandler) handleDeletePod(c echo.Context) error {
	namespace := c.Param("namespace")
	name := c.Param("name")
	k8sClient := getK8sClient(c)

	err := k8sClient.CoreV1().Pods(namespace).Delete(c.Request().Context(), name, metaV1.DeleteOptions{})

	if err != nil {
		return err
	}

	return c.NoContent(http.StatusOK)
}
