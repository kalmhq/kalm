package controllers

import (
	"context"
	"fmt"
	"testing"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type ComponentControllerWithWebhookSuite struct {
	BasicSuite

	ns  *coreV1.Namespace
	ctx context.Context
}

func (suite *ComponentControllerWithWebhookSuite) SetupSuite() {
	disableWebhook := false
	suite.BasicSuite.SetupSuite(disableWebhook)
}

func (suite *ComponentControllerWithWebhookSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *ComponentControllerWithWebhookSuite) SetupTest() {
	ns := suite.SetupKalmEnabledNs("")
	suite.ns = &ns
	suite.ctx = context.Background()
}

func TestComponentControllerWithWebhookSuite(t *testing.T) {
	suite.Run(t, new(ComponentControllerWithWebhookSuite))
}
func (suite *ComponentControllerWithWebhookSuite) TestComponentTenant() {

	component := generateEmptyComponent(suite.ns.Name)

	tenantName := suite.ns.Labels[v1alpha1.TenantNameLabelKey]

	if component.Labels == nil {
		component.Labels = make(map[string]string)
	}
	component.Labels[v1alpha1.TenantNameLabelKey] = tenantName

	// component with pvc
	pvcSize := resource.MustParse("1Mi")
	component.Spec.Volumes = []v1alpha1.Volume{
		{
			Type: v1alpha1.VolumeTypePersistentVolumeClaim,
			Size: pvcSize,
			Path: "/tmp/data",
		},
	}
	// component with resource limits
	cpuLimit := resource.MustParse("100m")
	memLimit := resource.MustParse("64Mi")

	component.Spec.ResourceRequirements = &coreV1.ResourceRequirements{
		Limits: map[coreV1.ResourceName]resource.Quantity{
			coreV1.ResourceCPU:    cpuLimit,
			coreV1.ResourceMemory: memLimit,
		},
	}

	// create
	suite.createComponent(component)

	var tenant v1alpha1.Tenant
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), client.ObjectKey{Name: tenantName}, &tenant)
		if err != nil {
			return false
		}

		statusResList := tenant.Status.UsedResourceQuota

		appCntRes := statusResList[v1alpha1.ResourceApplicationsCount]
		compCntRes := statusResList[v1alpha1.ResourceComponentsCount]
		storageRes := statusResList[v1alpha1.ResourceStorage]

		fmt.Println("status:", statusResList)

		one := resource.MustParse("1")

		return appCntRes.Cmp(one) == 0 &&
			compCntRes.Cmp(one) == 0 &&
			storageRes.Cmp(pvcSize) == 0
	})

	// Delete this component
	//   will release compCnt
	//   but not storage
	suite.reloadComponent(component)
	suite.Nil(suite.K8sClient.Delete(context.Background(), component))

	suite.Eventually(func() bool {
		suite.reloadTenant(&tenant)

		resStatus := tenant.Status.UsedResourceQuota

		compCntRes := resStatus[v1alpha1.ResourceComponentsCount]
		storage := resStatus[v1alpha1.ResourceStorage]

		return compCntRes.Cmp(resource.MustParse("0")) == 0 &&
			storage.Cmp(resource.MustParse("0")) != 0
	})

	// delete pvc will release storage
	var pvc coreV1.PersistentVolumeClaim
	err := suite.K8sClient.Get(context.Background(), types.NamespacedName{
		Namespace: suite.ns.Name,
		Name:      component.Spec.Volumes[0].PVC,
	}, &pvc)
	suite.Nil(err)

	suite.Nil(suite.K8sClient.Delete(context.Background(), &pvc))

	suite.Eventually(func() bool {
		suite.reloadTenant(&tenant)

		storage := tenant.Status.UsedResourceQuota[v1alpha1.ResourceStorage]
		return storage.Cmp(resource.MustParse("0")) == 0
	})
}

func (suite *ComponentControllerWithWebhookSuite) TestComponentWithWebhookUpdatingTenant() {
	// create
	component := generateEmptyComponent(suite.ns.Name)
	suite.createComponent(component)

	suite.Eventually(func() bool {
		var tenant v1alpha1.Tenant

		tenantName := suite.ns.Labels[v1alpha1.TenantNameLabelKey]
		if err := suite.K8sClient.Get(context.Background(), client.ObjectKey{Name: tenantName}, &tenant); err != nil {
			return false
		}

		statusResList := tenant.Status.UsedResourceQuota

		expectedSize := len(statusResList) == 4
		appCnt := statusResList[v1alpha1.ResourceApplicationsCount]
		compCnt := statusResList[v1alpha1.ResourceComponentsCount]
		svcCnt := statusResList[v1alpha1.ResourceServicesCount]
		rbCnt := statusResList[v1alpha1.ResourceRoleBindingCount]

		fmt.Println("size", len(statusResList))
		fmt.Println("status", statusResList)

		one := resource.MustParse("1")

		return expectedSize &&
			appCnt.Cmp(one) == 0 &&
			compCnt.Cmp(one) == 0 &&
			svcCnt.Cmp(one) == 0 &&
			rbCnt.Cmp(one) == 0
	})
}
