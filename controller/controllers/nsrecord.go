package controllers

import (
	"context"
	"errors"
	"fmt"
	"github.com/cloudflare/cloudflare-go"
	corev1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type DnsRecorder interface {
	CreateDnsRecord(*corev1alpha1.DnsRecord) error
	DeleteDnsRecord(*corev1alpha1.DnsRecord) error
	UpdateDnsRecord(*corev1alpha1.DnsRecord) error
	CheckDnsRecordReady(*corev1alpha1.DnsRecord) (bool, error)
	GetDnsRecords(*corev1alpha1.DnsRecord) (*corev1alpha1.DnsRecord, error)
}

type CloudflareNsRecorder struct {
	client.Client
	*cloudflare.API
	*ClusterInfo
	Ready bool
}

func (c CloudflareNsRecorder) CheckDnsRecordReady(record *corev1alpha1.DnsRecord) (bool, error) {
	return true, nil
}

func (c CloudflareNsRecorder) GetDnsRecords(record *corev1alpha1.DnsRecord) (*corev1alpha1.DnsRecord, error) {
	if !c.Ready {
		if _, err := c.completeRecorder(); err != nil {
			return nil, err
		}
	}

	if records, err := c.API.DNSRecords(c.DnsZoneID, cloudflare.DNSRecord{
		Type: record.Spec.Type,
		Name: record.Spec.Name,
	}); err != nil {
		return nil, err
	} else if len(records) > 0 {
		return &corev1alpha1.DnsRecord{
			Spec: corev1alpha1.DnsRecordSpec{
				Type:    records[0].Type,
				Name:    records[0].Name,
				Content: records[0].Content,
			},
		}, nil
	}

	return nil, nil
}

func (c CloudflareNsRecorder) CreateDnsRecord(record *corev1alpha1.DnsRecord) error {
	if !c.Ready {
		if _, err := c.completeRecorder(); err != nil {
			return err
		}
	}

	if records, err := c.API.DNSRecords(c.DnsZoneID, cloudflare.DNSRecord{
		Type: record.Spec.Type,
		Name: record.Spec.Name,
	}); err != nil {
		return err
	} else if len(records) == 1 {
		return nil
	}

	if resp, err := c.API.CreateDNSRecord(c.DnsZoneID, cloudflare.DNSRecord{
		Type:    record.Spec.Type,
		Name:    record.Spec.Name,
		Content: record.Spec.Content,
		TTL:     1,
	}); err != nil {
		return err
	} else if resp.Success == false {

		return errors.New("create ns record fail")
	}

	return nil
}

func (c CloudflareNsRecorder) DeleteDnsRecord(record *corev1alpha1.DnsRecord) error {
	if !c.Ready {
		if _, err := c.completeRecorder(); err != nil {
			return err
		}
	}

	records, err := c.API.DNSRecords(c.DnsZoneID, cloudflare.DNSRecord{
		Type: record.Spec.Type,
		Name: record.Spec.Name,
	})

	if err != nil {
		return err
	} else if len(records) == 0 {
		return nil
	}

	if err := c.API.DeleteDNSRecord(c.DnsZoneID, records[0].ID); err != nil {
		return err
	}

	return nil
}

func (c CloudflareNsRecorder) UpdateDnsRecord(record *corev1alpha1.DnsRecord) error {
	return nil
}

func (c *CloudflareNsRecorder) completeRecorder() (*CloudflareNsRecorder, error) {
	clusterInfo, err := getClusterInfo(c.Client)

	if err != nil || !clusterInfo.IsValid() {
		return c, errors.New("get cluster info fail")
	}

	if api, err := cloudflare.NewWithAPIToken(clusterInfo.CloudflareDnsApiToken); err != nil {
		return c, err
	} else {
		zoneDetail, err := api.ZoneDetails(clusterInfo.DnsZoneID)
		if err != nil {
			return c, err
		}

		if zoneDetail.Status != "active" {
			return c, errors.New("zone status not ready")
		}

		c.API = api
		c.ClusterInfo = clusterInfo
		c.Ready = true

		return c, nil
	}
}

func getTenantDefaultDomains(client client.Client, tenantName string) ([]string, error) {
	if clusterInfo, err := getClusterInfo(client); err != nil && !clusterInfo.IsValid() {
		return nil, errors.New("get cluster info error")
	} else {
		tenantDnsRecordName := fmt.Sprintf("%s.%s.%s", tenantName, clusterInfo.ClusterZone, clusterInfo.DnsZone)
		dnsWildcardRecordName := fmt.Sprintf("*.%s.%s.%s", tenantName, clusterInfo.ClusterZone, clusterInfo.DnsZone)
		return []string{tenantDnsRecordName, dnsWildcardRecordName}, nil
	}
}

func InitCloudflareNsRecorder(client client.Client) (*CloudflareNsRecorder, error) {
	cloudflareNsRecorder := &CloudflareNsRecorder{Client: client, Ready: false}

	return cloudflareNsRecorder.completeRecorder()
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

func (f FakeNsRecorder) GetDnsRecords(record *corev1alpha1.DnsRecord) (*corev1alpha1.DnsRecord, error) {
	return nil, nil
}

const ClusterInfoSecretName = "kalm-cluster-info-secret"
const CloudflareDnsApiTokenKey = "CLOUDFLARE_DNS_API_TOKEN"
const DnsZoneIDKey = "CLOUDFLARE_DNS_ZONE_ID"
const DnsZoneKey = "CLOUDFLARE_DNS_ZONE"
const ClusterZoneKey = "CLUSTER_ZONE"
const ClusterIngressIpKey = "CLUSTER_INGRESS_IP"

type ClusterInfo struct {
	CloudflareDnsApiToken string
	DnsZoneID             string
	DnsZone               string
	ClusterZone           string
	ClusterIngresIp       string
}

func getClusterInfo(client client.Client) (*ClusterInfo, error) {
	var clusterInfoSecret corev1.Secret

	if err := client.Get(context.Background(), types.NamespacedName{Namespace: KalmSystemNamespace, Name: ClusterInfoSecretName}, &clusterInfoSecret); err != nil {
		return &ClusterInfo{}, err
	}

	return &ClusterInfo{
		CloudflareDnsApiToken: string(clusterInfoSecret.Data[CloudflareDnsApiTokenKey]),
		DnsZone:               string(clusterInfoSecret.Data[DnsZoneKey]),
		DnsZoneID:             string(clusterInfoSecret.Data[DnsZoneIDKey]),
		ClusterZone:           string(clusterInfoSecret.Data[ClusterZoneKey]),
		ClusterIngresIp:       string(clusterInfoSecret.Data[ClusterIngressIpKey]),
	}, nil
}

func (c *ClusterInfo) IsValid() bool {
	return c.CloudflareDnsApiToken != "" && c.DnsZone != "" && c.DnsZoneID != "" && c.ClusterZone != "" && c.ClusterIngresIp != ""
}
