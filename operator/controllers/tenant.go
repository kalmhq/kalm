package controllers

import (
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

const DefaultTenantName = "global"

func (r *KalmOperatorConfigReconciler) reconcileDefaultTenantForLocalMode() error {
	expectedTenant := v1alpha1.Tenant{
		ObjectMeta: metav1.ObjectMeta{
			Name: DefaultTenantName,
		},
		Spec: v1alpha1.TenantSpec{
			TenantDisplayName: "auto-tenant-for-local-mode",
			ResourceQuota: map[v1alpha1.ResourceName]resource.Quantity{
				v1alpha1.ResourceCPU:                   resource.MustParse("9999"),
				v1alpha1.ResourceMemory:                resource.MustParse("9999Gi"),
				v1alpha1.ResourceStorage:               resource.MustParse("9999Gi"),
				v1alpha1.ResourceEphemeralStorage:      resource.MustParse("9999Gi"),
				v1alpha1.ResourceTraffic:               resource.MustParse("9999Gi"),
				v1alpha1.ResourceHttpRoutesCount:       resource.MustParse("9999"),
				v1alpha1.ResourceHttpsCertsCount:       resource.MustParse("9999"),
				v1alpha1.ResourceDockerRegistriesCount: resource.MustParse("9999"),
				v1alpha1.ResourceApplicationsCount:     resource.MustParse("9999"),
				v1alpha1.ResourceServicesCount:         resource.MustParse("9999"),
				v1alpha1.ResourceComponentsCount:       resource.MustParse("9999"),
				v1alpha1.ResourceAccessTokensCount:     resource.MustParse("9999"),
				v1alpha1.ResourceRoleBindingCount:      resource.MustParse("9999"),
			},
			Owners: []string{"kalm-operator"},
		},
	}

	return r.createOrUpdateTenant(expectedTenant)
}

func (r *KalmOperatorConfigReconciler) reconcileDefaultTenantForBYOCMode(owner string) error {
	expectedTenant := v1alpha1.Tenant{
		ObjectMeta: metav1.ObjectMeta{
			Name: DefaultTenantName,
		},
		Spec: v1alpha1.TenantSpec{
			TenantDisplayName: "auto-tenant-for-byoc-mode",
			ResourceQuota: map[v1alpha1.ResourceName]resource.Quantity{
				v1alpha1.ResourceCPU:                   resource.MustParse("9999"),
				v1alpha1.ResourceMemory:                resource.MustParse("9999Gi"),
				v1alpha1.ResourceStorage:               resource.MustParse("9999Gi"),
				v1alpha1.ResourceEphemeralStorage:      resource.MustParse("9999Gi"),
				v1alpha1.ResourceTraffic:               resource.MustParse("9999Gi"),
				v1alpha1.ResourceHttpRoutesCount:       resource.MustParse("9999"),
				v1alpha1.ResourceHttpsCertsCount:       resource.MustParse("9999"),
				v1alpha1.ResourceDockerRegistriesCount: resource.MustParse("9999"),
				v1alpha1.ResourceApplicationsCount:     resource.MustParse("9999"),
				v1alpha1.ResourceServicesCount:         resource.MustParse("9999"),
				v1alpha1.ResourceComponentsCount:       resource.MustParse("9999"),
				v1alpha1.ResourceAccessTokensCount:     resource.MustParse("9999"),
				v1alpha1.ResourceRoleBindingCount:      resource.MustParse("9999"),
			},
			Owners: []string{owner},
		},
	}

	return r.createOrUpdateTenant(expectedTenant)
}

func (r *KalmOperatorConfigReconciler) reconcileDefaultTenantForSaaSMode() error {
	expectedTenant := v1alpha1.Tenant{
		ObjectMeta: metav1.ObjectMeta{
			Name: DefaultTenantName,
		},
		Spec: v1alpha1.TenantSpec{
			TenantDisplayName: "auto-tenant-for-saas-mode",
			ResourceQuota: map[v1alpha1.ResourceName]resource.Quantity{
				v1alpha1.ResourceCPU:                   resource.MustParse("10"),
				v1alpha1.ResourceMemory:                resource.MustParse("10Gi"),
				v1alpha1.ResourceStorage:               resource.MustParse("100Gi"),
				v1alpha1.ResourceEphemeralStorage:      resource.MustParse("100Gi"),
				v1alpha1.ResourceTraffic:               resource.MustParse("100Gi"),
				v1alpha1.ResourceHttpRoutesCount:       resource.MustParse("100"),
				v1alpha1.ResourceHttpsCertsCount:       resource.MustParse("100"),
				v1alpha1.ResourceDockerRegistriesCount: resource.MustParse("100"),
				v1alpha1.ResourceApplicationsCount:     resource.MustParse("100"),
				v1alpha1.ResourceServicesCount:         resource.MustParse("100"),
				v1alpha1.ResourceComponentsCount:       resource.MustParse("100"),
				v1alpha1.ResourceAccessTokensCount:     resource.MustParse("100"),
				v1alpha1.ResourceRoleBindingCount:      resource.MustParse("100"),
			},
			Owners: []string{"kalm-operator"},
		},
	}

	return r.createOrUpdateTenant(expectedTenant)
}

func (r *KalmOperatorConfigReconciler) createOrUpdateTenant(expectedTenant v1alpha1.Tenant) error {
	var tenant v1alpha1.Tenant
	isNew := false

	if err := r.Get(r.Ctx, client.ObjectKey{Name: DefaultTenantName}, &tenant); err != nil {
		if errors.IsNotFound(err) {
			isNew = true
		} else {
			return nil
		}
	}

	var err error
	if isNew {
		tenant = expectedTenant
		err = r.Create(r.Ctx, &expectedTenant)
	} else {
		tenant.Spec = expectedTenant.Spec
		err = r.Update(r.Ctx, &tenant)
	}

	return err
}
