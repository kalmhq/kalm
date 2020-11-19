package controllers

import (
	"context"
	"fmt"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/types"
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
	tenant := suite.BasicSuite.SetupTenant()

	var defaultTenantHttpscert v1alpha1.HttpsCert
	defaultTenantHttpCertName := getDefaultTenantHttpCertName(tenant.Name)

	tenantDnsRecordName := fmt.Sprintf("%s-dns-a-record", tenant.Name)
	dnsWildcardRecordName := fmt.Sprintf("%s-dns-wildcard-record", tenant.Name)
	dnsChallengeCnameRecordName := fmt.Sprintf("%s-dns-challengecname-record", tenant.Name)

	var dnsRecord v1alpha1.DnsRecord
	var wildcardDnsRecord v1alpha1.DnsRecord
	var dnsChallengeCnameRecord v1alpha1.DnsRecord

	suite.Eventually(func() bool {
		if err := suite.K8sClient.Get(suite.ctx, types.NamespacedName{Name: defaultTenantHttpCertName}, &defaultTenantHttpscert); err != nil {
			return false
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
			wildcardDnsRecord.Status.Status == "ready" &&
			dnsChallengeCnameRecord.Status.Status == "ready"
	}, "can't get deployment")
}

func TestDnsRecordControllerTestSuite(t *testing.T) {
	suite.Run(t, new(DnsRecordControllerTestSuite))
}
