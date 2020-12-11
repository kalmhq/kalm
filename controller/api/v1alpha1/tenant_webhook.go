/*

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package v1alpha1

import (
	"context"
	"fmt"

	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/webhook"
)

var tenantlog = logf.Log.WithName("tenant-resource")

func (r *Tenant) SetupWebhookWithManager(mgr ctrl.Manager) error {
	return ctrl.NewWebhookManagedBy(mgr).
		For(r).
		Complete()
}

// +kubebuilder:webhook:verbs=create;update,path=/validate-core-kalm-dev-v1alpha1-tenant,mutating=false,failurePolicy=fail,groups=core.kalm.dev,resources=tenants,versions=v1alpha1,name=vtenant.kb.io

var _ webhook.Validator = &Tenant{}

func (r *Tenant) ValidateCreate() error {
	tenantlog.Info("validate create", "name", r.Name)

	if missingList, ok := r.isResourceListComplete(); !ok {
		return fmt.Errorf("missing resource: %s", missingList)
	}

	return checkAndUpdateClusterResourceQuota(*r, 3)
}

func checkAndUpdateClusterResourceQuota(tenant Tenant, remainingRetry int) error {

	var clusterResourceQuota ClusterResourceQuota
	err := webhookClient.Get(context.Background(), client.ObjectKey{Name: ClusterResourceQuotaName}, &clusterResourceQuota)
	if err != nil {
		if errors.IsNotFound(err) {
			// if ClusterResourceQuota is not created, we will allow tenant creation by default
			return nil
		}

		return err
	}

	var tenantList TenantList
	if err := webhookClient.List(context.Background(), &tenantList); err != nil {
		return err
	}

	tenantSum := SumTenantResourceWithCurrentOne(tenantList.Items, tenant, true)
	if exist, infoList := ExistGreaterResourceInList(tenantSum, clusterResourceQuota.Spec.ResourceQuota); exist {
		return fmt.Errorf("creating this tenant will exceed cluster resource quota, details: %s", infoList)
	}

	copied := clusterResourceQuota.DeepCopy()
	copied.Status.UsedResourceQuota = tenantSum
	if err := webhookClient.Status().Update(context.Background(), copied); err != nil {
		if remainingRetry <= 0 {
			return err
		}

		return checkAndUpdateClusterResourceQuota(tenant, remainingRetry-1)
	}

	return nil
}

func SumTenantResourceInCluster(tenantList []Tenant, ignoreGlobalTenant bool) ResourceList {
	var rst ResourceList

	var updatedList []Tenant
	for _, tenant := range tenantList {
		//ignore global tenant
		if ignoreGlobalTenant {
			if tenant.Name == DefaultGlobalTenantName ||
				tenant.Name == DefaultSystemTenantName {
				continue
			}
		}

		updatedList = append(updatedList, tenant)
	}

	var tenantCnt int
	for _, item := range updatedList {
		if item.DeletionTimestamp != nil {
			continue
		}

		rst = SumResourceList(rst, item.Spec.ResourceQuota)
		tenantCnt += 1
	}

	// also include cnt
	cntQuantity := resource.NewQuantity(int64(tenantCnt), resource.DecimalSI)
	rst[ResourceTenantsCount] = *cntQuantity

	return rst
}

func SumTenantResourceWithCurrentOne(tenantList []Tenant, current Tenant, ignoreGlobalTenant bool) ResourceList {

	// for update, same key tenant exist in list as current
	tenantMap := make(map[string]Tenant)
	for _, item := range tenantList {
		tenantMap[getKey(&item)] = item
	}
	tenantMap[getKey(&current)] = current

	var updatedList []Tenant
	for _, item := range tenantMap {
		updatedList = append(updatedList, item)
	}

	return SumTenantResourceInCluster(updatedList, ignoreGlobalTenant)
}

func (r *Tenant) ValidateUpdate(old runtime.Object) error {
	tenantlog.Info("validate update", "name", r.Name)

	if missingList, ok := r.isResourceListComplete(); !ok {
		return fmt.Errorf("missing resource: %s", missingList)
	}

	oldTenant, ok := old.(*Tenant)
	if !ok {
		return fmt.Errorf("old object is not Tenant")
	}

	isRequiringMore, _ := ExistGreaterResourceInList(r.Spec.ResourceQuota, oldTenant.Spec.ResourceQuota)
	if !isRequiringMore {
		return nil
	}

	return checkAndUpdateClusterResourceQuota(*r, 3)
}

func (r *Tenant) ValidateDelete() error {
	tenantlog.Info("validate delete", "name", r.Name)
	return nil
}

func (r *Tenant) isResourceListComplete() ([]ResourceName, bool) {
	tenantResourceList := r.Spec.ResourceQuota

	zeroQuantity := resource.NewQuantity(0, resource.DecimalSI)

	missingResources := []ResourceName{}
	for _, resName := range ResourceNameList {
		quantity, exist := tenantResourceList[resName]
		if !exist || quantity.Cmp(*zeroQuantity) <= 0 {
			missingResources = append(missingResources, resName)
		}
	}

	return missingResources, len(missingResources) == 0
}
