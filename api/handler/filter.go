package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	v1 "k8s.io/api/core/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (h *ApiHandler) filterAuthorizedApplications(c echo.Context, apps []*v1.Namespace) []*v1.Namespace {
	l := len(apps)

	for i := 0; i < l; i++ {
		tenantName, err := v1alpha1.GetTenantNameFromObj(apps[i])

		if err != nil {
			continue
		}

		scope := tenantName + "/" + apps[i].Name

		if !h.clientManager.CanViewScope(getCurrentUser(c), scope) {
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
		scope := records[i].Tenant + "/" + records[i].Namespace

		if !h.clientManager.CanViewScope(getCurrentUser(c), scope) {
			records[l-1], records[i] = records[i], records[l-1]
			i--
			l--
		}
	}

	return records[:l]
}

func belongsToTenant(tenantName string) client.ListOption {
	return client.MatchingLabels{
		v1alpha1.TenantNameLabelKey: tenantName,
	}
}

func hasName(name string) client.ListOption {
	return client.MatchingField("metadata.name", name)
}

func limitOne() client.ListOption {
	return client.Limit(1)
}
