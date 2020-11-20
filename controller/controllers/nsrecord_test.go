package controllers

import (
	"context"
	"fmt"
	"github.com/joho/godotenv"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"os"
	"testing"
)

type DnsRecordTestSuite struct {
	BasicSuite

	ns  *coreV1.Namespace
	ctx context.Context
}

func (suite *DnsRecordTestSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite(true)
}

func (suite *DnsRecordTestSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *DnsRecordTestSuite) SetupTest() {
	ns := suite.SetupKalmEnabledNs("")
	suite.ns = &ns
	suite.ctx = context.Background()
}

func (suite *DnsRecordTestSuite) TestCreateDnsRecordWhenCreateTenant() {
	dnsRecorder, err := InitCloudflareNsRecorder(suite.K8sClient)

	suite.Nil(err)
	suite.NotNil(dnsRecorder)
	suite.EqualValues(false, dnsRecorder.Ready)

	_ = godotenv.Load("../.env")

	if os.Getenv("ClusterZone") == "" {
		fmt.Println("cluster info envs not set")
		return
	}
	createClusterInfoSecret(suite.BasicSuite)
	defaultDomains, err := getTenantDefaultDomains(suite.K8sClient, "testTenant")
	suite.EqualValues(2, len(defaultDomains))
	_, err = dnsRecorder.completeRecorder()

	suite.Nil(err)
	suite.EqualValues(true, dnsRecorder.Ready)

	dnsRecord := v1alpha1.DnsRecord{
		ObjectMeta: metaV1.ObjectMeta{
			Name: "test-cloudflare-dns-record",
		},
		Spec: v1alpha1.DnsRecordSpec{
			Name:       fmt.Sprintf("test-record.%s", dnsRecorder.DnsZone),
			Type:       "A",
			TenantName: "test-tenant",
			Content:    dnsRecorder.ClusterIngresIp,
		},
	}

	err = dnsRecorder.CreateDnsRecord(&dnsRecord)
	suite.Nil(err)

	createdDnsRecord, err := dnsRecorder.GetDnsRecords(&dnsRecord)
	suite.Nil(err)
	suite.EqualValues(fmt.Sprintf("test-record.%s", dnsRecorder.DnsZone), createdDnsRecord.Spec.Name)

	err = dnsRecorder.DeleteDnsRecord(&dnsRecord)
	suite.Nil(err)

	deletedDnsRecord, err := dnsRecorder.GetDnsRecords(&dnsRecord)
	suite.Nil(err)
	suite.Nil(deletedDnsRecord)
}

func TestDnsRecordTestSuite(t *testing.T) {
	suite.Run(t, new(DnsRecordTestSuite))
}

func createClusterInfoSecret(suite BasicSuite) {
	kalmNamespace := coreV1.Namespace{
		ObjectMeta: metaV1.ObjectMeta{
			Name: KalmSystemNamespace,
		},
	}

	clusterInfoSecret := coreV1.Secret{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      ClusterInfoSecretName,
			Namespace: KalmSystemNamespace,
		},
		Type: coreV1.SecretTypeOpaque,
		StringData: map[string]string{
			CloudflareDnsApiTokenKey: os.Getenv("CloudflareDnsApiToken"),
			DnsZoneIDKey:             os.Getenv("DnsZoneID"),
			DnsZoneKey:               os.Getenv("DnsZone"),
			ClusterZoneKey:           os.Getenv("ClusterZone"),
			ClusterIngressIpKey:      os.Getenv("ClusterIngressIp"),
		},
	}
	suite.createObject(&kalmNamespace)
	suite.createObject(&clusterInfoSecret)

	suite.Eventually(func() bool {
		var actSecret coreV1.Secret
		var actKalmNamespace coreV1.Namespace
		errNs := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: KalmSystemNamespace}, &actKalmNamespace)
		errSecret := suite.K8sClient.Get(context.Background(), types.NamespacedName{Namespace: KalmSystemNamespace, Name: ClusterInfoSecretName}, &actSecret)

		return errNs == nil && errSecret == nil && actSecret.Data != nil && len(actSecret.Data[ClusterZoneKey]) != 0
	}, "can't get cluster info")
}
