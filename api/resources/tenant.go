package resources

import (
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type Tenant struct {
	ID                string                `json:"id"`
	Name              string                `json:"name"`
	Owners            []string              `json:"owners"`
	Paused            bool                  `json:"paused"`
	ResourcesQuotas   v1alpha1.ResourceList `json:"resourceQuotas"`
	ConsumedResources v1alpha1.ResourceList `json:"consumedResources"`
	AccessToken       string                `json:"accessToken"`
}

func (resourceManager *ResourceManager) GetTenants() ([]*Tenant, error) {
	var fetched v1alpha1.TenantList

	if err := resourceManager.List(&fetched); err != nil {
		return nil, err
	}

	res := make([]*Tenant, 0, len(fetched.Items))

	for i := range fetched.Items {
		res = append(res, fromCRDTenant(&fetched.Items[i]))
	}

	return res, nil
}

func (resourceManager *ResourceManager) IsATenantOwner(email, tenantName string) bool {
	tenant, err := resourceManager.GetTenant(tenantName)

	if err != nil {
		return false
	}

	for i := range tenant.Owners {
		if tenant.Owners[i] == email {
			return true
		}
	}

	return false
}

func (resourceManager *ResourceManager) GetTenant(name string) (*Tenant, error) {
	var fetched v1alpha1.Tenant

	if err := resourceManager.Get("", name, &fetched); err != nil {
		return nil, err
	}

	return fromCRDTenant(&fetched), nil
}

func (resourceManager *ResourceManager) CreateTenant(tenant *Tenant) (*Tenant, error) {
	crdTenant := toCRDTenant(tenant)

	if err := resourceManager.Create(crdTenant); err != nil {
		return nil, err
	}

	return fromCRDTenant(crdTenant), nil
}

func (resourceManager *ResourceManager) UpdateTenant(tenant *Tenant) (*Tenant, error) {
	crdTenant := toCRDTenant(tenant)

	if err := resourceManager.Apply(crdTenant); err != nil {
		return nil, err
	}

	return fromCRDTenant(crdTenant), nil
}

func (resourceManager *ResourceManager) DeleteTenant(name string) error {
	return resourceManager.Delete(&v1alpha1.Tenant{
		ObjectMeta: v1.ObjectMeta{
			Name: name,
		},
	})
}

func (resourceManager *ResourceManager) PauseTenant(name string) error {
	return resourceManager.Patch(&v1alpha1.Tenant{
		ObjectMeta: v1.ObjectMeta{
			Name: name,
		},
	}, client.RawPatch(types.JSONPatchType, []byte(`[
    {
        "op": "replace",
        "path": "/spec/paused",
        "value": true
    }
]`)))
}

func (resourceManager *ResourceManager) ResumeTenant(name string) error {
	return resourceManager.Patch(&v1alpha1.Tenant{
		ObjectMeta: v1.ObjectMeta{
			Name: name,
		},
	}, client.RawPatch(types.JSONPatchType, []byte(`[
    {
        "op": "replace",
        "path": "/spec/paused",
        "value": false
    }
]`)))
}

func fromCRDTenant(tenant *v1alpha1.Tenant) *Tenant {
	return &Tenant{
		ID:                tenant.Name, // TODO: which field should be used as an id?
		Name:              tenant.Name,
		Owners:            tenant.Spec.Owners,
		Paused:            tenant.Spec.Paused,
		ResourcesQuotas:   tenant.Spec.ResourceQuota,
		ConsumedResources: tenant.Status.UsedResourceQuota,
	}
}

func toCRDTenant(tenant *Tenant) *v1alpha1.Tenant {
	return &v1alpha1.Tenant{
		TypeMeta: metaV1.TypeMeta{
			Kind:       "Tenant",
			APIVersion: "core.kalm.dev/v1alpha1",
		},
		ObjectMeta: v1.ObjectMeta{
			Name: tenant.Name,
		},
		Spec: v1alpha1.TenantSpec{
			Owners:        tenant.Owners,
			ResourceQuota: tenant.ResourcesQuotas,
			Paused:        tenant.Paused,
		},
		Status: v1alpha1.TenantStatus{
			UsedResourceQuota: tenant.ConsumedResources,
		},
	}
}
