package v1alpha1

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"k8s.io/apimachinery/pkg/util/rand"
)

func ExamplegetDirectCNAMEOfDomain() {
	domain := "tst1crmapps.starbucks.com"

	for i := 0; i < 10; i++ {
		cname, err := getDirectCNAMEOfDomain(domain)
		fmt.Println(cname, err)
	}
}

// func TestGetIPOfDomain(t *testing.T) {
// 	domain := "kalm.dev"

// 	for i := 0; i < 10; i++ {
// 		ips, err := getIPsOfDomain(domain)
// 		fmt.Println(ips, err)
// 	}
// }

func TestIsDomainConfiguredAsExpectedARecord(t *testing.T) {
	domainSpec := DomainSpec{
		Domain:    fmt.Sprintf("random-domain-%s.com", rand.String(10)),
		DNSType:   DNSTypeA,
		DNSTarget: "1.1.1.1",
	}

	isAsExpected, err := IsDomainConfiguredAsExpected(domainSpec)
	assert.Nil(t, err)
	assert.False(t, isAsExpected)
}

func TestIsDomainConfiguredAsExpectedCNAME(t *testing.T) {
	domainSpec := DomainSpec{
		Domain:    fmt.Sprintf("random-domain-%s.com", rand.String(10)),
		DNSType:   DNSTypeCNAME,
		DNSTarget: "fake-cname-target.com",
	}

	isAsExpected, err := IsDomainConfiguredAsExpected(domainSpec)
	assert.Nil(t, err)
	assert.False(t, isAsExpected)
}

// func TestIsDomainConfiguredAsExpectedARecord2(t *testing.T) {
// 	domainSpec := DomainSpec{
// 		Domain:    "kalm.dev",
// 		DNSType:   DNSTypeA,
// 		DNSTarget: "134.209.226.211",
// 	}

// 	isAsExpected, err := IsDomainConfiguredAsExpected(domainSpec)
// 	assert.Nil(t, err)
// 	assert.True(t, isAsExpected)
// }

// func TestIsDomainConfiguredAsExpectedCNAME2(t *testing.T) {
// 	domainSpec := DomainSpec{
// 		Domain:    "t1.foo.xyz",
// 		DNSType:   DNSTypeCNAME,
// 		DNSTarget: "982121f3bcc89412f8f79d87d2b9a894-cluster-8hfcrsva-cname.asia-northeast3.kalm-dns.com",
// 	}

// 	isAsExpected, err := IsDomainConfiguredAsExpected(domainSpec)
// 	assert.Nil(t, err)
// 	assert.True(t, isAsExpected)
// }
