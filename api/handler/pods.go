package handler

import (
	"github.com/labstack/echo/v4"
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
)

func (h *ApiHandler) handleDeletePod(c echo.Context) error {
	err := h.Builder(c).Delete(&coreV1.Pod{ObjectMeta: metaV1.ObjectMeta{
		Namespace: c.Param("namespace"),
		Name:      c.Param("name"),
	}})

	if err != nil {
		return err
	}

	return c.NoContent(http.StatusOK)
}
