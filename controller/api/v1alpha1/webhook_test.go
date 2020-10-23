package v1alpha1

import (
	"k8s.io/apimachinery/pkg/api/resource"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes/scheme"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
)

// In api test, we don't actually use a real k8s cluster.
// Instead, we use a fake client and a default tenant.
func SetupWebhookClientWithTenant() *Tenant {
	AddToScheme(scheme.Scheme)

	tenant := &Tenant{
		ObjectMeta: metaV1.ObjectMeta{
			Name: "tenant",
		},
		Spec: TenantSpec{
			TenantDisplayName: "tenant",
			ResourceQuota: map[ResourceName]resource.Quantity{
				ResourceApplicationsCount: resource.MustParse("100"),
				ResourceServicesCount:     resource.MustParse("100"),
				ResourceComponentsCount:   resource.MustParse("100"),
				ResourceCPU:               resource.MustParse("100"),
				ResourceMemory:            resource.MustParse("100Gi"),
			},
			Owners: []string{"david"},
		},
	}

	webhookClient = fake.NewFakeClient(tenant)
	return tenant
}
