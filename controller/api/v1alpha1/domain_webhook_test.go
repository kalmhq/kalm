package v1alpha1

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func TestRootDomainWebhookDefault(t *testing.T) {
	os.Setenv(ENV_KALM_CLUSTER_IP, "1.1.1.1")

	d := &Domain{
		ObjectMeta: metav1.ObjectMeta{
			Labels: map[string]string{
				"tenant": "fake-tenant",
			},
		},
		Spec: DomainSpec{
			Domain: "golang.org",
		},
	}

	d.Default()

	assert.Equal(t, "A", string(d.Spec.DNSType))
	assert.Equal(t, "1.1.1.1", d.Spec.DNSTarget)
	assert.Equal(t, "36e9498b339f6578751164d26c7ac9c1", d.Spec.Txt)
}

func TestSubDomainWebhookDefault(t *testing.T) {
	os.Setenv(ENV_KALM_BASE_DNS_DOMAIN, "dns.foobar.com")

	d := &Domain{
		ObjectMeta: metav1.ObjectMeta{
			Labels: map[string]string{
				"tenant": "fake-tenant",
			},
		},
		Spec: DomainSpec{
			Domain: "a.golang.org",
		},
	}

	d.Default()

	assert.Equal(t, "CNAME", string(d.Spec.DNSType))
	assert.Equal(t, "d39aad95357511f3201c3f355271e5d5-cname.dns.foobar.com", d.Spec.DNSTarget)
	assert.Equal(t, "d39aad95357511f3201c3f355271e5d5", d.Spec.Txt)
}

func TestWildcardDomainWebhookDefault(t *testing.T) {
	os.Setenv(ENV_KALM_BASE_DNS_DOMAIN, "dns.foobar.com")

	d := &Domain{
		ObjectMeta: metav1.ObjectMeta{
			Labels: map[string]string{
				"tenant": "fake-tenant",
			},
		},
		Spec: DomainSpec{
			Domain: "*.golang.org",
		},
	}

	d.Default()

	assert.Equal(t, "CNAME", string(d.Spec.DNSType))
	assert.Equal(t, "2c6b61109f99375642cd8527c523a367-cname.dns.foobar.com", d.Spec.DNSTarget)
	assert.Equal(t, "2c6b61109f99375642cd8527c523a367", d.Spec.Txt)
}
