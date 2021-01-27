package handler

import (
	"crypto/md5"
	"fmt"
	"net/http"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (h *ApiHandler) InstallDNSRecordHandlers(e *echo.Group) {
	e.GET("/dnsrecords", h.handleListDNSRecords)
	e.GET("/dnsrecords/:name", h.handleGetDNSRecord)
	e.PUT("/dnsrecords", h.handleUpdateDNSRecord)
	e.POST("/dnsrecords", h.handleCreateDNSRecord)
	e.DELETE("/dnsrecords/:name", h.handleDeleteDNSRecord)
}

type DNSRecord struct {
	Domain    string `json:"domain"`
	DNSType   string `json:"dnsType"`
	DNSTarget string `json:"dnsTarget"`
	//resp
	Name         string `json:"name"`
	IsConfigured bool   `json:"isConfigured"`
}

func (h *ApiHandler) handleListDNSRecords(c echo.Context) error {
	curUser := getCurrentUser(c)

	h.MustCanManageCluster(curUser)

	dnsRecordList := v1alpha1.DNSRecordList{}
	if err := h.resourceManager.List(&dnsRecordList); err != nil {
		return err
	}

	return c.JSON(200, wrapDNSRecordListAsResp(dnsRecordList.Items))
}

func (h *ApiHandler) handleGetDNSRecord(c echo.Context) error {
	curUser := getCurrentUser(c)

	h.MustCanManageCluster(curUser)

	name := c.Param("name")
	dnsRecord := v1alpha1.DNSRecord{}
	if err := h.resourceManager.Get("", name, &dnsRecord); err != nil {
		return err
	}

	return c.JSON(200, wrapDNSRecordAsResp(&dnsRecord))
}

func (h *ApiHandler) handleCreateDNSRecord(c echo.Context) error {
	// permission check: only global cluster manager can create DNSRecord

	curUser := getCurrentUser(c)

	h.MustCanManageCluster(curUser)

	record, err := getDNSRecordFromContext(c)
	if err != nil {
		return err
	}

	if err := h.resourceManager.Create(record); err != nil {
		return err
	}

	return c.JSON(201, wrapDNSRecordAsResp(record))
}

// can only update DNSTarget
func (h *ApiHandler) handleUpdateDNSRecord(c echo.Context) error {
	curUser := getCurrentUser(c)

	h.MustCanManageCluster(curUser)

	res, err := getDNSRecordFromContext(c)
	if err != nil {
		return err
	}

	name := c.Param("name")
	dnsRecord := v1alpha1.DNSRecord{}

	if err := h.resourceManager.Get("", name, &dnsRecord); err != nil {
		return err
	}

	dnsRecord.Spec.DNSTarget = res.Spec.DNSTarget
	if err := h.resourceManager.Update(&dnsRecord); err != nil {
		return err
	}

	return c.JSON(200, wrapDNSRecordAsResp(&dnsRecord))
}

func (h *ApiHandler) handleDeleteDNSRecord(c echo.Context) error {
	curUser := getCurrentUser(c)

	h.MustCanManageCluster(curUser)

	name := c.Param("name")
	dnsRecord := v1alpha1.DNSRecord{ObjectMeta: metav1.ObjectMeta{Name: name}}
	if err := h.resourceManager.Delete(&dnsRecord); err != nil {
		return err
	}

	return c.NoContent(http.StatusOK)
}

func getDNSRecordFromContext(ctx echo.Context) (*v1alpha1.DNSRecord, error) {
	record := DNSRecord{}
	if err := ctx.Bind(&record); err != nil {
		return nil, err
	}

	name := getNameOfDNSRecord(record)

	return &v1alpha1.DNSRecord{
		ObjectMeta: metav1.ObjectMeta{Name: name},
		Spec: v1alpha1.DNSRecordSpec{
			Domain:    record.Domain,
			DNSType:   v1alpha1.DNSType(record.DNSType),
			DNSTarget: record.DNSTarget,
		},
	}, nil
}

func getNameOfDNSRecord(r DNSRecord) string {
	domainAndType := fmt.Sprintf("%s-%s", r.Domain, r.DNSType)

	md5Domain := md5.Sum([]byte(domainAndType))

	name := fmt.Sprintf("%x", md5Domain)

	return name
}

func wrapDNSRecordAsResp(record *v1alpha1.DNSRecord) DNSRecord {
	return DNSRecord{
		Name:         record.Name,
		Domain:       record.Spec.Domain,
		DNSType:      string(record.Spec.DNSType),
		DNSTarget:    record.Spec.DNSTarget,
		IsConfigured: record.Status.IsConfigured,
	}
}

func wrapDNSRecordListAsResp(records []v1alpha1.DNSRecord) []DNSRecord {
	rst := []DNSRecord{}

	for _, r := range records {
		rst = append(rst, wrapDNSRecordAsResp(&r))
	}

	return rst
}
