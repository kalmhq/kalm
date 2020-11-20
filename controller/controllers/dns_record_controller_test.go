package controllers

import (
	"context"
	"fmt"
	"github.com/joho/godotenv"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/types"
	"os"
	"testing"
)

type DnsRecordControllerTestSuite struct {
	BasicSuite

	ns  *coreV1.Namespace
	ctx context.Context
}

func (suite *DnsRecordControllerTestSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite(true)
}

func (suite *DnsRecordControllerTestSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *DnsRecordControllerTestSuite) SetupTest() {
	ns := suite.SetupKalmEnabledNs("")
	suite.ns = &ns
	suite.ctx = context.Background()
}

func (suite *PSPSuite) TestCreateDnsRecordControllerWhenCreateTenant() {
	err := godotenv.Load("../.env")
	suite.Nil(err)

	if os.Getenv("ClusterZone") == "" {
		fmt.Println("cluster info envs not set")
		return
	}
	createClusterInfoSecret(suite.BasicSuite)

	clusterInfo, err := getClusterInfo(suite.K8sClient)
	suite.Nil(err)
	suite.NotNil(clusterInfo)
	suite.True(clusterInfo.IsValid())

	tenant := suite.BasicSuite.SetupTenant()

	var defaultTenantHttpscert v1alpha1.HttpsCert
	defaultTenantHttpCertName := getDefaultTenantHttpCertName(tenant.Name)

	tenantDnsRecordName := fmt.Sprintf("%s-dns-a-record", tenant.Name)
	dnsWildcardRecordName := fmt.Sprintf("%s-dns-wildcard-record", tenant.Name)
	dnsChallengeCnameRecordName := fmt.Sprintf("%s-dns-challengecname-record", tenant.Name)

	var dnsRecord v1alpha1.DnsRecord
	var wildcardDnsRecord v1alpha1.DnsRecord
	var dnsChallengeCnameRecord v1alpha1.DnsRecord

	testTenantWildcardDsdCname := "test-tenant-wildcard-nsd-cname"
	suite.Eventually(func() bool {
		if err := suite.K8sClient.Get(suite.ctx, types.NamespacedName{Name: defaultTenantHttpCertName}, &defaultTenantHttpscert); err != nil {
			return false
		} else {
			if defaultTenantHttpscert.Status.WildcardCertDNSChallengeDomainMap == nil {
				defaultTenantHttpscert.Status.WildcardCertDNSChallengeDomainMap = make(map[string]string)
				defaultTenantHttpscert.Status.WildcardCertDNSChallengeDomainMap[fmt.Sprintf("%s.%s.%s", tenant.Name, clusterInfo.ClusterZone, clusterInfo.DnsZone)] = testTenantWildcardDsdCname
				if err := suite.K8sClient.Status().Update(suite.ctx, &defaultTenantHttpscert); err != nil {
					return false
				}
			}
		}
		if err := suite.K8sClient.Get(suite.ctx, types.NamespacedName{Name: tenantDnsRecordName}, &dnsRecord); err != nil {
			return false
		}
		if err := suite.K8sClient.Get(suite.ctx, types.NamespacedName{Name: dnsWildcardRecordName}, &wildcardDnsRecord); err != nil {
			return false
		}
		if err := suite.K8sClient.Get(suite.ctx, types.NamespacedName{Name: dnsChallengeCnameRecordName}, &dnsChallengeCnameRecord); err != nil {
			return false
		}

		return defaultTenantHttpscert.Name == defaultTenantHttpCertName &&
			defaultTenantHttpscert.Spec.HttpsCertIssuer == v1alpha1.DefaultDNS01IssuerName &&
			dnsRecord.Status.Status == "ready" &&
			dnsRecord.Spec.Type == "A" &&
			dnsRecord.Spec.Name == fmt.Sprintf("%s.%s.%s", tenant.Name, clusterInfo.ClusterZone, clusterInfo.DnsZone) &&
			dnsRecord.Spec.Content == clusterInfo.ClusterIngresIp &&
			wildcardDnsRecord.Status.Status == "ready" &&
			wildcardDnsRecord.Spec.Type == "A" &&
			wildcardDnsRecord.Spec.Name == fmt.Sprintf("*.%s.%s.%s", tenant.Name, clusterInfo.ClusterZone, clusterInfo.DnsZone) &&
			wildcardDnsRecord.Spec.Content == clusterInfo.ClusterIngresIp &&
			dnsChallengeCnameRecord.Status.Status == "ready" &&
			dnsChallengeCnameRecord.Spec.Type == "CNAME" &&
			dnsChallengeCnameRecord.Spec.Name == fmt.Sprintf("_acme-challenge.%s.%s.%s", tenant.Name, clusterInfo.ClusterZone, clusterInfo.DnsZone) &&
			dnsChallengeCnameRecord.Spec.Content == testTenantWildcardDsdCname
	}, "can't get dnsRecord")

	err = suite.K8sClient.Delete(suite.ctx, tenant)
	suite.Nil(err)

	//suite.Eventually(func() bool {
	//	errCert := suite.K8sClient.Get(suite.ctx, types.NamespacedName{Name: defaultTenantHttpCertName}, &defaultTenantHttpscert)
	//
	//	errDnsRecord := suite.K8sClient.Get(suite.ctx, types.NamespacedName{Name: tenantDnsRecordName}, &dnsRecord)
	//
	//	errWildcardRecord := suite.K8sClient.Get(suite.ctx, types.NamespacedName{Name: dnsWildcardRecordName}, &wildcardDnsRecord)
	//
	//	errCnameRecord := suite.K8sClient.Get(suite.ctx, types.NamespacedName{Name: dnsChallengeCnameRecordName}, &dnsChallengeCnameRecord)
	//
	//	return errors.IsNotFound(errCert) && errors.IsNotFound(errDnsRecord) && errors.IsNotFound(errWildcardRecord) && errors.IsNotFound(errCnameRecord)
	//}, "delete dnsRecord fail")
}

func TestDnsRecordControllerTestSuite(t *testing.T) {
	suite.Run(t, new(DnsRecordControllerTestSuite))
}
