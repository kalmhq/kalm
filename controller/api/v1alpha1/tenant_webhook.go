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

// +kubebuilder:webhook:verbs=create;update,path=/validate-core-v1alpha1-tenant,mutating=false,failurePolicy=fail,groups=core,resources=tenants,versions=v1alpha1,name=vtenant.kb.io

var _ webhook.Validator = &Tenant{}

func (r *Tenant) ValidateCreate() error {
	tenantlog.Info("validate create", "name", r.Name)

	var clusterResourceQuota ClusterResourceQuota
	err := webhookClient.Get(context.Background(), client.ObjectKey{Name: ClusterResourceQuotaName}, &clusterResourceQuota)
	if err != nil {
		if errors.IsNotFound(err) {
			return nil
		}

		return err
	}

	var tenantList TenantList
	if err := webhookClient.List(context.Background(), &tenantList); err != nil {
		return err
	}

	tenantSum := sumResource(append(tenantList.Items, *r))
	if exist, infoList := ExistGreaterResourceInList(tenantSum, clusterResourceQuota.Spec.ResourceQuota); exist {
		return fmt.Errorf("creating this tenant will exceed cluster resource quota, details: %s", infoList)
	}

	return nil
}

func sumResource(tenantList []Tenant) ResourceList {
	rst := make(ResourceList)

	for _, item := range tenantList {
		if item.DeletionTimestamp != nil {
			continue
		}

		rst = SumResourceList(rst, item.Spec.ResourceQuota)
	}

	return rst
}

func (r *Tenant) ValidateUpdate(old runtime.Object) error {
	tenantlog.Info("validate update", "name", r.Name)

	// TODO(user): fill in your validation logic upon object update.
	return nil
}

func (r *Tenant) ValidateDelete() error {
	tenantlog.Info("validate delete", "name", r.Name)
	return nil
}
