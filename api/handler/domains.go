package handler

import (
	"crypto/md5"
	"fmt"
	"net/http"

	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (h *ApiHandler) InstallDomainHandlers(e *echo.Group) {
	e.GET("/domains", h.handleListDomains)
	e.GET("/domains/:name", h.handleGetDomain)
	e.POST("/domains", h.handleCreateDomain)
	e.DELETE("/domains/:name", h.handleDeleteDomain)
}

func (h *ApiHandler) handleListDomains(c echo.Context) error {
	// TODO: certs are required to support http route
	// h.MustCanManageCluster(getCurrentUser(c))

	var domainList v1alpha1.DomainList
	if err := h.resourceManager.List(&domainList); err != nil {
		return err
	}

	domains := resources.WrapDomainListAsResp(domainList.Items)

	baseAppDomain := v1alpha1.GetEnvKalmBaseAppDomain()
	if baseAppDomain != "" {
		domains = append([]resources.Domain{
			{
				Name:       "default",
				Domain:     "*." + baseAppDomain,
				RecordType: "CNAME",
				Target:     "",
			},
		}, domains...)
	}

	return c.JSON(http.StatusOK, domains)
}

func (h *ApiHandler) handleGetDomain(c echo.Context) error {
	// TODO: certs are required to support http route
	// h.MustCanManageCluster(getCurrentUser(c))

	var rst v1alpha1.Domain
	if err := h.resourceManager.Get("", c.Param("name"), &rst); err != nil {
		return err
	}

	return c.JSON(http.StatusOK, resources.WrapDomainAsResp(rst))
}

func (h *ApiHandler) handleCreateDomain(c echo.Context) error {
	h.MustCanManageCluster(getCurrentUser(c))

	domain, err := getDomainFromContext(c)
	if err != nil {
		return err
	}

	if err := h.resourceManager.Create(domain); err != nil {
		return err
	}

	return c.JSON(201, resources.WrapDomainAsResp(*domain))
}

func (h *ApiHandler) handleDeleteDomain(c echo.Context) error {
	h.MustCanManageCluster(getCurrentUser(c))
	var fetched v1alpha1.Domain
	if err := h.resourceManager.Get("", c.Param("name"), &fetched); err != nil {
		return err
	}

	err := h.resourceManager.Delete(&fetched)
	if err != nil {
		return err
	}

	return c.NoContent(http.StatusOK)
}

func getDomainFromContext(c echo.Context) (*v1alpha1.Domain, error) {
	var resDomain resources.Domain
	if err := c.Bind(&resDomain); err != nil {
		return nil, err
	}

	md5Domain := md5.Sum([]byte(resDomain.Domain))

	// <md5Domain>
	name := fmt.Sprintf("%x", md5Domain)

	rst := v1alpha1.Domain{
		ObjectMeta: metav1.ObjectMeta{
			Name: name,
		},
		Spec: v1alpha1.DomainSpec{
			Domain: resDomain.Domain,
		},
	}

	return &rst, nil
}
