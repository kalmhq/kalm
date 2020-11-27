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

package controllers

import (
	"context"

	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
)

// ClusterResourceQuotaReconciler reconciles a ClusterResourceQuota object
type ClusterResourceQuotaReconciler struct {
	*BaseReconciler
	ctx context.Context
}

func NewClusterResourceQuotaReconciler(mgr ctrl.Manager) *ClusterResourceQuotaReconciler {
	return &ClusterResourceQuotaReconciler{
		BaseReconciler: NewBaseReconciler(mgr, "ClusterResource"),
		ctx:            context.Background(),
	}
}

// +kubebuilder:rbac:groups=core.kalm.dev,resources=clusterresourcequota,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kalm.dev,resources=clusterresourcequota/status,verbs=get;update;patch

func (r *ClusterResourceQuotaReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	log := r.Log.WithValues("clusterresourcequota", req.NamespacedName)

	if req.Name != v1alpha1.ClusterResourceQuotaName {
		log.Info("see record without default name, will do nothing for this invalid record")
		return ctrl.Result{}, nil
	}

	var clusterResourceQuota v1alpha1.ClusterResourceQuota
	if err := r.Get(r.ctx, client.ObjectKey{Name: v1alpha1.ClusterResourceQuotaName}, &clusterResourceQuota); err != nil {
		if errors.IsNotFound(err) {
			return ctrl.Result{}, nil
		}

		return ctrl.Result{}, err
	}

	// list and sum tenant, update status.usedResource
	var tenantList v1alpha1.TenantList
	if err := r.List(r.ctx, &tenantList); err != nil {
		return ctrl.Result{}, err
	}

	var usedResourceList v1alpha1.ResourceList
	for _, tenant := range tenantList.Items {
		usedResourceList = v1alpha1.SumResourceList(usedResourceList, tenant.Status.UsedResourceQuota)
	}

	copied := clusterResourceQuota.DeepCopy()
	copied.Status.UsedResourceQuota = usedResourceList

	if err := r.Status().Update(r.ctx, copied); err != nil {
		log.Error(err, "fail when update status")
		return ctrl.Result{}, err
	}

	return ctrl.Result{}, nil
}

type toSingletonClusterResourceQuotaMapper struct{}

func (_ toSingletonClusterResourceQuotaMapper) Map(_ handler.MapObject) []reconcile.Request {
	return []reconcile.Request{
		{
			NamespacedName: types.NamespacedName{
				Name: v1alpha1.ClusterResourceQuotaName,
			},
		},
	}
}

func (r *ClusterResourceQuotaReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&v1alpha1.ClusterResourceQuota{}).
		Watches(genSourceForObject(&v1alpha1.Tenant{}), &handler.EnqueueRequestsFromMapFunc{
			ToRequests: toSingletonClusterResourceQuotaMapper{},
		}).
		Complete(r)
}
