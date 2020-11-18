package controllers

import (
	"errors"
	"github.com/cloudflare/cloudflare-go"
	corev1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
)

type DnsRecorder interface {
	CreateDnsRecord(*corev1alpha1.DnsRecord) error
	DeleteDnsRecord(*corev1alpha1.DnsRecord) error
	UpdateDnsRecord(*corev1alpha1.DnsRecord) error
	CheckDnsRecordReady(*corev1alpha1.DnsRecord) (bool, error)
	GetDnsRecords(*corev1alpha1.DnsRecord) ([]corev1alpha1.DnsRecord, error)
}

type CloudflareNsRecorder struct {
	zone   string
	zoneID string
	*cloudflare.API
}

// TODO
func (c CloudflareNsRecorder) CheckDnsRecordReady(record *corev1alpha1.DnsRecord) (bool, error) {
	return true, nil
}

func (c CloudflareNsRecorder) GetDnsRecords(record *corev1alpha1.DnsRecord) ([]corev1alpha1.DnsRecord, error) {
	return nil, nil
}

func (c CloudflareNsRecorder) CreateDnsRecord(record *corev1alpha1.DnsRecord) error {
	if records, err := c.API.DNSRecords(c.zoneID, cloudflare.DNSRecord{
		Type: record.Spec.Type,
		Name: record.Name,
	}); err != nil {
		return err
	} else if len(records) == 1 {
		return nil
	}

	if resp, err := c.API.CreateDNSRecord(c.zoneID, cloudflare.DNSRecord{
		Type:    record.Spec.Type,
		Name:    record.Name,
		Content: record.Spec.Content,
		TTL:     1,
	}); err != nil {
		return err
	} else if resp.Success == false {

		return errors.New("create ns record fail")
	}

	return nil
}

// TODO
func (c CloudflareNsRecorder) DeleteDnsRecord(record *corev1alpha1.DnsRecord) error {
	return nil
}

// TODO
func (c CloudflareNsRecorder) UpdateDnsRecord(record *corev1alpha1.DnsRecord) error {
	return nil
}

func InitCloudflareNsRecorder(zoneName, apiToken string) (*CloudflareNsRecorder, error) {
	if apiToken == "" || zoneName == "" {
		return nil, errors.New("zoneName and apiToken must't be empty")
	}

	if api, err := cloudflare.NewWithAPIToken(apiToken); err != nil {
		return nil, err
	} else {
		zoneID, err := api.ZoneIDByName(zoneName)
		if err != nil {
			return nil, err
		}

		zoneDetail, err := api.ZoneDetails(zoneID)
		if err != nil {
			return nil, err
		}

		if zoneDetail.Status != "active" {
			return nil, errors.New("zone status not ready")
		}

		return &CloudflareNsRecorder{
			zoneID: zoneID,
			zone:   zoneName,
			API:    api,
		}, nil
	}
}

type FakeNsRecorder struct {
}

func (f FakeNsRecorder) CreateDnsRecord(record *corev1alpha1.DnsRecord) error {
	return nil
}

func (f FakeNsRecorder) DeleteDnsRecord(record *corev1alpha1.DnsRecord) error {
	return nil
}

func (f FakeNsRecorder) UpdateDnsRecord(record *corev1alpha1.DnsRecord) error {
	return nil
}

func (f FakeNsRecorder) CheckDnsRecordReady(record *corev1alpha1.DnsRecord) (bool, error) {
	return true, nil
}

func (f FakeNsRecorder) GetDnsRecords(record *corev1alpha1.DnsRecord) ([]corev1alpha1.DnsRecord, error) {
	return nil, nil
}
