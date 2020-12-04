package handler

import (
	"fmt"
	"strings"

	"github.com/kalmhq/kalm/api/log"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	"k8s.io/apimachinery/pkg/util/rand"
)

func (h *ApiHandler) InstallHttpRouteHandlers(e *echo.Group) {
	e.GET("/httproutes", h.handleListAllRoutes)
	e.POST("/httproutes", h.handleCreateRoute)
	e.PUT("/httproutes/:name", h.handleUpdateRoute)
	e.DELETE("/httproutes/:name", h.handleDeleteRoute)
}

func (h *ApiHandler) handleListAllRoutes(c echo.Context) error {
	currentUser := getCurrentUser(c)

	list, err := h.resourceManager.GetHttpRoutes(belongsToTenant(currentUser.Tenant))
	list = h.filterAuthorizedHttpRoutes(c, list)

	if err != nil {
		return err
	}

	return c.JSON(200, list)
}

func (h *ApiHandler) handleListRoutes(c echo.Context) error {
	currentUser := getCurrentUser(c)

	list, err := h.resourceManager.GetHttpRoutes(belongsToTenant(currentUser.Tenant))
	list = h.filterAuthorizedHttpRoutes(c, list)

	if err != nil {
		return err
	}

	return c.JSON(200, list)
}

func (h *ApiHandler) handleCreateRoute(c echo.Context) (err error) {
	currentUser := getCurrentUser(c)
	var route *resources.HttpRoute

	if route, err = getHttpRouteFromContext(c); err != nil {
		return err
	}

	tenantName := currentUser.Tenant
	if tenantName == "" {
		return fmt.Errorf("should set tenant but empty")
	}

	route.Tenant = tenantName

	if !h.clientManager.CanOperateHttpRoute(currentUser, "edit", route) {
		return resources.InsufficientPermissionsError
	}

	// for saas version, strict check if httpRoute is using baseDomain
	if !h.IsLocalMode {
		kalmBaseDomain := h.BaseDomain

		if kalmBaseDomain == "" {
			log.Info("for saas version, BaseDomain should be set but is empty")
		} else {
			// support using kalmDomain if route.Hosts is empty
			if len(route.HttpRouteSpec.Hosts) == 0 {
				randomKalmDomain := fmt.Sprintf("%s-%s.%s", rand.String(5), tenantName, kalmBaseDomain)
				route.HttpRouteSpec.Hosts = []string{randomKalmDomain}
			}

			for _, host := range route.Hosts {
				// if is XXXasia-northeast3.kapp.live
				if !strings.HasSuffix(host, kalmBaseDomain) {
					continue
				}

				// then must be: YYY<tenant>.asia-northeast3.kapp.live
				validKalmDomainSuffixForUser := fmt.Sprintf("%s.%s", tenantName, kalmBaseDomain)
				if !strings.HasSuffix(host, validKalmDomainSuffixForUser) {
					return fmt.Errorf("httpRoute using KalmDomain must be like: xx-%s", validKalmDomainSuffixForUser)
				}
			}
		}
	}

	if route, err = h.resourceManager.CreateHttpRoute(route); err != nil {
		return err
	}

	return c.JSON(201, route)
}

func (h *ApiHandler) handleUpdateRoute(c echo.Context) (err error) {
	currentUser := getCurrentUser(c)
	var route *resources.HttpRoute

	if route, err = getHttpRouteFromContext(c); err != nil {
		return err
	}

	// TODO: check if current user can edit all old http route destinations
	if !h.clientManager.CanOperateHttpRoute(currentUser, "edit", route) {
		return resources.InsufficientPermissionsError
	}

	if !h.IsLocalMode {
		baseDomain := h.ClusterBaseDomain
		tenantName := currentUser.Tenant

		if baseDomain != "" && tenantName != "" {
			ok, idxList := v1alpha1.IsHttpRouteSpecValidIfUsingKalmDomain(baseDomain, tenantName, *route.HttpRouteSpec)
			if !ok {
				var invalidHosts []string
				for _, idx := range idxList {
					invalidHosts = append(invalidHosts, route.Hosts[idx])
				}

				return fmt.Errorf("invalid usage of kalmDomain, invalid hosts: %s", invalidHosts)
			}
		}
	}

	if route, err = h.resourceManager.UpdateHttpRoute(route); err != nil {
		return err
	}

	return c.JSON(200, route)
}

func (h *ApiHandler) handleDeleteRoute(c echo.Context) (err error) {
	route, err := h.resourceManager.GetHttpRoute("", c.Param("name"))

	if err != nil {
		return nil
	}

	if !h.clientManager.CanOperateHttpRoute(getCurrentUser(c), "edit", route) {
		return resources.InsufficientPermissionsError
	}

	if err = h.resourceManager.DeleteHttpRoute("", route.Name); err != nil {
		return err
	}

	return c.NoContent(200)
}

func getHttpRouteFromContext(c echo.Context) (*resources.HttpRoute, error) {
	var route resources.HttpRoute

	if err := c.Bind(&route); err != nil {
		return nil, err
	}

	if route.HttpRouteSpec == nil {
		return nil, fmt.Errorf("must provide route spec")
	}

	return &route, nil
}

func (h *ApiHandler) filterAuthorizedHttpRoutes(c echo.Context, records []*resources.HttpRoute) []*resources.HttpRoute {
	l := len(records)

	for i := 0; i < l; i++ {
		if !h.clientManager.CanOperateHttpRoute(getCurrentUser(c), "view", records[i]) {
			records[l-1], records[i] = records[i], records[l-1]
			i--
			l--
		}
	}

	return records[:l]
}
