package v1alpha1

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"k8s.io/apimachinery/pkg/api/resource"
)

type QuotaUsageTest struct {
	UsedQuota1 ResourceList
	UsedQuota2 ResourceList
	IsSame     bool
}

func TestIsResourceUsageExactlySame(t *testing.T) {
	tests := []QuotaUsageTest{
		{
			map[ResourceName]resource.Quantity{
				ResourceCPU:               resource.MustParse("1"),
				ResourceAccessTokensCount: resource.MustParse("9"),
			},
			map[ResourceName]resource.Quantity{
				ResourceCPU:               resource.MustParse("1"),
				ResourceAccessTokensCount: resource.MustParse("9"),
			},
			true,
		},
		{
			map[ResourceName]resource.Quantity{
				ResourceCPU:               resource.MustParse("1"),
				ResourceAccessTokensCount: resource.MustParse("9"),
			},
			map[ResourceName]resource.Quantity{
				ResourceCPU:                   resource.MustParse("1"),
				ResourceAccessTokensCount:     resource.MustParse("9"),
				ResourceDockerRegistriesCount: resource.MustParse("0"),
			},
			true,
		},
		{
			map[ResourceName]resource.Quantity{
				ResourceCPU:               resource.MustParse("1"),
				ResourceAccessTokensCount: resource.MustParse("9"),
			},
			map[ResourceName]resource.Quantity{
				ResourceCPU:                   resource.MustParse("1"),
				ResourceDockerRegistriesCount: resource.MustParse("0"),
			},
			false,
		},
	}

	for i, test := range tests {
		tenant1 := Tenant{
			Status: TenantStatus{
				UsedResourceQuota: test.UsedQuota1,
			},
		}
		tenant2 := Tenant{
			Status: TenantStatus{
				UsedResourceQuota: test.UsedQuota2,
			},
		}

		actual := isResourceUsageExactlySame(tenant1, tenant2)
		assert.Equal(t, test.IsSame, actual, fmt.Sprintf("test %d failed", i))
	}
}
