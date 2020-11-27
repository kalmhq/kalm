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

	ctrl "sigs.k8s.io/controller-runtime"

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
	_ = context.Background()
	log := r.Log.WithValues("clusterresourcequota", req.NamespacedName)

	if req.Name != v1alpha1.ClusterResourceQuotaName {
		log.Info("see record without default name, will do nothing for this invalid record")
		return ctrl.Result{}, nil
	}

	//todo
	// list and sum tenant, update status.usedResource

	return ctrl.Result{}, nil
}

func (r *ClusterResourceQuotaReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&v1alpha1.ClusterResourceQuota{}).
		//todo watch Tenants
		// Watches(&v1alpha1.Tenant{}, ).
		Complete(r)
}
