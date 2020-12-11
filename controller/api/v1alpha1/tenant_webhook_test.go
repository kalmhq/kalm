package v1alpha1

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"k8s.io/apimachinery/pkg/api/resource"
)

func TestIsResourceListComplete(t *testing.T) {
	tenant := &Tenant{
		Spec: TenantSpec{
			ResourceQuota: map[ResourceName]resource.Quantity{
				ResourceAccessTokensCount: *resource.NewQuantity(1, resource.DecimalSI),
			},
		},
	}

	missingList, ok := tenant.isResourceListComplete()
	assert.False(t, ok)
	assert.Equal(t, len(ResourceNameList)-1, len(missingList))
}

func TestMissingResourceTenant(t *testing.T) {
	tenant := &Tenant{
		Spec: TenantSpec{
			ResourceQuota: map[ResourceName]resource.Quantity{
				ResourceAccessTokensCount: *resource.NewQuantity(1, resource.DecimalSI),
			},
		},
	}

	err := tenant.ValidateCreate()
	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "missing resource")
}
