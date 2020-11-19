package v1alpha1

import (
	"fmt"
	"reflect"
	"testing"

	"github.com/stretchr/testify/assert"
	"k8s.io/apimachinery/pkg/api/resource"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func TestA(t *testing.T) {
	obj := DockerRegistry{ObjectMeta: v1.ObjectMeta{
		Name: "thisisname",
	}}

	bType := reflect.TypeOf(obj)
	getNameMeth, has1 := bType.FieldByName("Name")
	getNameMeth2, has2 := bType.FieldByName("FOOBAR")
	fmt.Printf("%t, %+v\n", has1, getNameMeth)
	fmt.Printf("%t, %+v\n", has2, getNameMeth2)

	val := reflect.ValueOf(&obj).Elem()

	name := val.Field(getNameMeth.Index[0])
	fmt.Println(name.Interface())

	name = val.FieldByName("Name")
	fmt.Printf("--------%+v\n", name)
}

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
