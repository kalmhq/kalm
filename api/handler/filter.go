package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
	v1 "k8s.io/api/core/v1"
)

func (h *ApiHandler) filterAuthorizedApplications(c echo.Context, apps []*v1.Namespace) []*v1.Namespace {
	l := len(apps)

	// select all visible namespaces
	for i := 0; i < l; i++ {
		if !h.clientManager.CanViewNamespace(getCurrentUser(c), apps[i].Name) {
			apps[l-1], apps[i] = apps[i], apps[l-1]
			i--
			l--
		}
	}

	return apps[:l]
}

func (h *ApiHandler) filterAuthorizedProtectedEndpoints(c echo.Context, records []*resources.ProtectedEndpoint) []*resources.ProtectedEndpoint {
	l := len(records)

	// select all visible namespaces
	for i := 0; i < l; i++ {
		if !h.clientManager.CanViewNamespace(getCurrentUser(c), records[i].Namespace) {
			records[l-1], records[i] = records[i], records[l-1]
			i--
			l--
		}
	}

	return records[:l]
}
