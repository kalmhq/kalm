package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
	v1 "k8s.io/api/core/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (h *ApiHandler) filterAuthorizedApplications(c echo.Context, apps []*v1.Namespace) []*v1.Namespace {
	l := len(apps)

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

	for i := 0; i < l; i++ {
		if !h.clientManager.CanViewNamespace(getCurrentUser(c), records[i].Namespace) {
			records[l-1], records[i] = records[i], records[l-1]
			i--
			l--
		}
	}

	return records[:l]
}

func hasName(name string) client.ListOption {
	return client.MatchingField("metadata.name", name)
}

func limitOne() client.ListOption {
	return client.Limit(1)
}
