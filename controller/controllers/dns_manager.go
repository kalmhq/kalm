package controllers

import (
	"fmt"
	"strings"

	"github.com/cloudflare/cloudflare-go"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
)

type DNSRecord struct {
	ID      string
	DNSType v1alpha1.DNSType
	Name    string
	Content string
}

type DNSManager interface {
	CreateDNSRecord(dnsType v1alpha1.DNSType, name, content string) error
	DeleteDNSRecord(dnsType v1alpha1.DNSType, name string) error
	UpsertDNSRecord(dnsType v1alpha1.DNSType, name, content string) error
	GetDNSRecords(domain string) ([]DNSRecord, error)
}

var _ DNSManager = CloudflareDNSManager{}

type CloudflareDNSManager struct {
	APIToken         string
	Domain2ZoneIDMap map[string]string
	*cloudflare.API
}

func NewCloudflareDNSManager(token string, domain2ZoneIDMap map[string]string) (*CloudflareDNSManager, error) {
	api, err := cloudflare.NewWithAPIToken(token)
	if err != nil {
		return nil, err
	}

	return &CloudflareDNSManager{
		APIToken:         token,
		Domain2ZoneIDMap: domain2ZoneIDMap,
		API:              api,
	}, nil
}

var NoCloudflareZoneIDForDomainError = fmt.Errorf("no cloudflare zone id for domain error")

func (m CloudflareDNSManager) CreateDNSRecord(dnsType v1alpha1.DNSType, name, content string) error {
	rootDomain := getRootDomain(name)

	zoneID, exist := m.Domain2ZoneIDMap[rootDomain]
	if !exist {
		return NoCloudflareZoneIDForDomainError
	}

	resp, err := m.API.CreateDNSRecord(zoneID, cloudflare.DNSRecord{
		Type:    string(dnsType),
		Name:    name,
		Content: content,
	})

	if err != nil {
		return err
	} else if !resp.Success {
		return fmt.Errorf("CreateDNSRecord failed, info: %+v", resp.Errors)
	}

	return nil
}

func (m CloudflareDNSManager) DeleteDNSRecord(dnsType v1alpha1.DNSType, domain string) error {
	rootDomain := getRootDomain(domain)

	zoneID, exist := m.Domain2ZoneIDMap[rootDomain]
	if !exist {
		return NoCloudflareZoneIDForDomainError
	}

	records, err := m.GetDNSRecords(domain)
	if err != nil {
		return err
	}

	for _, r := range records {
		if r.DNSType != dnsType || r.Name != domain {
			continue
		}

		return m.API.DeleteDNSRecord(zoneID, r.ID)
	}

	// for not exist record, return without error
	return nil
}

func (m CloudflareDNSManager) UpsertDNSRecord(dnsType v1alpha1.DNSType, name, content string) error {
	m.DeleteDNSRecord(dnsType, name)

	return m.CreateDNSRecord(dnsType, name, content)
}

func (m CloudflareDNSManager) GetDNSRecords(domain string) ([]DNSRecord, error) {
	rootDomain := getRootDomain(domain)

	zoneID, exist := m.Domain2ZoneIDMap[rootDomain]
	if !exist {
		return nil, NoCloudflareZoneIDForDomainError
	}

	resp, err := m.API.DNSRecords(zoneID, cloudflare.DNSRecord{})
	if err != nil {
		return nil, err
	}

	var rst []DNSRecord
	for _, record := range resp {
		rst = append(rst, DNSRecord{
			ID:      record.ID,
			DNSType: v1alpha1.DNSType(record.Type),
			Name:    record.Name,
			Content: record.Content,
		})
	}

	return rst, nil
}

// a.b.com -> b.com
func getRootDomain(domain string) string {
	parts := strings.Split(domain, ".")

	size := len(parts)
	if size <= 1 {
		return ""
	}

	return parts[size-2] + "." + parts[size-1]
}
