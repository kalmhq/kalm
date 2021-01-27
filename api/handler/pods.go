package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	batchV1 "k8s.io/api/batch/v1"
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (h *ApiHandler) handleDeletePod(c echo.Context) error {
	currentUser := getCurrentUser(c)
	h.MustCanEdit(currentUser, c.Param("namespace"), "*")

	err := h.resourceManager.Delete(&coreV1.Pod{ObjectMeta: metaV1.ObjectMeta{
		Namespace: c.Param("namespace"),
		Name:      c.Param("name"),
	}})

	if err != nil {
		return err
	}

	return c.NoContent(http.StatusOK)
}

func (h *ApiHandler) handleDeleteJob(c echo.Context) error {
	currentUser := getCurrentUser(c)
	h.MustCanEdit(currentUser, c.Param("namespace"), "*")

	err := h.resourceManager.Delete(&batchV1.Job{ObjectMeta: metaV1.ObjectMeta{
		Namespace: c.Param("namespace"),
		Name:      c.Param("name"),
	}})

	if err != nil {
		return err
	}

	return c.NoContent(http.StatusOK)
}
