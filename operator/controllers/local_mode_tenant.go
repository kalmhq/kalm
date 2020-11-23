package controllers

import (
	"context"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

const DefaultTenantNameForLocalMode = "global"

func (r *KalmOperatorConfigReconciler) reconcileDefaultTenantForLocalMode(ctx context.Context) error {
	expectedTenant := v1alpha1.Tenant{
		ObjectMeta: metav1.ObjectMeta{
			Name: DefaultTenantNameForLocalMode,
		},
		Spec: v1alpha1.TenantSpec{
			TenantDisplayName: "auto-tenant-for-local-mode",
			ResourceQuota: map[v1alpha1.ResourceName]resource.Quantity{
				v1alpha1.ResourceHttpRoutesCount:       resource.MustParse("10000"),
				v1alpha1.ResourceHttpsCertsCount:       resource.MustParse("10000"),
				v1alpha1.ResourceDockerRegistriesCount: resource.MustParse("10000"),
				v1alpha1.ResourceApplicationsCount:     resource.MustParse("10000"),
				v1alpha1.ResourceServicesCount:         resource.MustParse("10000"),
				v1alpha1.ResourceComponentsCount:       resource.MustParse("10000"),
				v1alpha1.ResourceCPU:                   resource.MustParse("10000"),
				v1alpha1.ResourceMemory:                resource.MustParse("10000Gi"),
				v1alpha1.ResourceStorage:               resource.MustParse("10000Gi"),
				v1alpha1.ResourceEphemeralStorage:      resource.MustParse("10000Gi"),
			},
			Owners: []string{"kalm-operator"},
		},
	}

	var tenant v1alpha1.Tenant
	isNew := false

	if err := r.Get(ctx, client.ObjectKey{Name: DefaultTenantNameForLocalMode}, &tenant); err != nil {
		if errors.IsNotFound(err) {
			isNew = true
		} else {
			return nil
		}
	}

	var err error
	if isNew {
		tenant = expectedTenant
		err = r.Create(ctx, &expectedTenant)
	} else {
		tenant.Spec = expectedTenant.Spec
		err = r.Update(ctx, &expectedTenant)
	}

	return err
}
