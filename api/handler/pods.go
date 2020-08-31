package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
)

func (h *ApiHandler) handleDeletePod(c echo.Context) error {
	builder := h.Builder(c)

	if !builder.CanEditNamespace(c.Param("namespace")) {
		return resources.NoNamespaceEditorRoleError(c.Param("namespace"))
	}

	err := builder.Delete(&coreV1.Pod{ObjectMeta: metaV1.ObjectMeta{
		Namespace: c.Param("namespace"),
		Name:      c.Param("name"),
	}})

	if err != nil {
		return err
	}

	return c.NoContent(http.StatusOK)
}
