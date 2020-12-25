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
	e.PUT("/domains/:name", h.handleTriggerDomainCheck)
	e.DELETE("/domains/:name", h.handleDeleteDomain)
}

func (h *ApiHandler) handleListDomains(c echo.Context) error {
	currentUser := getCurrentUser(c)

	var domainList v1alpha1.DomainList
	if err := h.resourceManager.List(&domainList, belongsToTenant(currentUser.Tenant)); err != nil {
		return err
	}

	afterFilter := h.filterAuthorizedDomains(c, "view", domainList.Items)

	domains := resources.WrapDomainListAsResp(afterFilter)

	baseAppDomain := h.BaseAppDomain
	if baseAppDomain != "" {
		domains = append([]resources.Domain{
			{
				Name:       "default",
				Domain:     fmt.Sprintf("*%s.%s", currentUser.Tenant, baseAppDomain),
				Status:     "ready",
				RecordType: "CNAME",
				Target:     "",
				IsBuiltIn:  true,
			},
		}, domains...)
	}

	return c.JSON(http.StatusOK, domains)
}

func (h *ApiHandler) filterAuthorizedDomains(c echo.Context, action string, records []v1alpha1.Domain) []v1alpha1.Domain {
	rst := []v1alpha1.Domain{}

	for _, record := range records {
		if !h.clientManager.CanOperateDomains(getCurrentUser(c), action, &record) {
			continue
		}

		rst = append(rst, record)
	}

	return rst
}

func (h *ApiHandler) handleGetDomain(c echo.Context) error {
	var rst v1alpha1.Domain
	if err := h.resourceManager.Get("", c.Param("name"), &rst); err != nil {
		return err
	}

	if !h.clientManager.CanOperateDomains(getCurrentUser(c), "view", &rst) {
		return fmt.Errorf("no permission to view this domain: %s", c.Param("name"))
	}

	return c.JSON(http.StatusOK, resources.WrapDomainAsResp(rst))
}

func (h *ApiHandler) handleCreateDomain(c echo.Context) error {
	currentUser := getCurrentUser(c)
	h.MustCanEdit(currentUser, currentUser.Tenant+"/*", "domains/*")

	domain, err := getDomainFromContext(c)
	if err != nil {
		return err
	}

	domainVal := domain.Spec.Domain
	if !v1alpha1.IsValidNoneWildcardDomain(domainVal) &&
		!v1alpha1.IsValidWildcardDomain(domainVal) {
		return fmt.Errorf("domain is valid: %s", domainVal)
	}

	if err := h.resourceManager.Create(domain); err != nil {
		return err
	}

	return c.JSON(201, resources.WrapDomainAsResp(*domain))
}

type TriggerDomainCheckReq struct {
	DNSTargetReadyToCheck bool `json:"dnsTargetReadyToCheck"`
	TxtReadyToCheck       bool `json:"txtReadyToCheck"`
}

func (h *ApiHandler) handleTriggerDomainCheck(c echo.Context) error {
	var fetched v1alpha1.Domain
	if err := h.resourceManager.Get("", c.Param("name"), &fetched); err != nil {
		return err
	}

	if !h.clientManager.CanOperateDomains(getCurrentUser(c), "manage", &fetched) {
		return resources.InsufficientPermissionsError
	}

	req := TriggerDomainCheckReq{}
	if err := c.Bind(&req); err != nil {
		return err
	}

	copied := fetched.DeepCopy()
	if req.DNSTargetReadyToCheck {
		copied.Spec.DNSTargetReadyToCheck = true
	}
	if req.TxtReadyToCheck {
		copied.Spec.TxtReadyToCheck = true
	}

	if err := h.resourceManager.Update(copied); err != nil {
		return err
	}

	return c.JSON(http.StatusOK, copied)
}

func (h *ApiHandler) handleDeleteDomain(c echo.Context) error {
	var fetched v1alpha1.Domain
	if err := h.resourceManager.Get("", c.Param("name"), &fetched); err != nil {
		return err
	}

	if !h.clientManager.CanOperateDomains(getCurrentUser(c), "manage", &fetched) {
		return resources.InsufficientPermissionsError
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

	currentUser := getCurrentUser(c)
	tenantName := currentUser.Tenant

	md5Domain := md5.Sum([]byte(resDomain.Domain))

	// <md5Domain>-<tenantName>
	name := fmt.Sprintf("%x-%s", md5Domain, currentUser.Tenant)

	rst := v1alpha1.Domain{
		ObjectMeta: metav1.ObjectMeta{
			Name: name,
			Labels: map[string]string{
				v1alpha1.TenantNameLabelKey: tenantName,
			},
		},
		Spec: v1alpha1.DomainSpec{
			Domain: resDomain.Domain,
		},
	}

	return &rst, nil
}
