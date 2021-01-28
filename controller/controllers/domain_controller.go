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

	corev1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
)

// DomainReconciler reconciles a Domain object
type DomainReconciler struct {
	*BaseReconciler
	ctx    context.Context
	dnsMgr DNSManager
}

func NewDomainReconciler(mgr ctrl.Manager) *DomainReconciler {
	// var dnsMgr DNSManager
	// if cloudflareDNSMgr, err := initCloudflareDNSManagerFromEnv(); err != nil {
	// 	ctrl.Log.Info("failed when initCloudflareDNSManagerFromEnv", "err", err)
	// } else {
	// 	dnsMgr = cloudflareDNSMgr
	// }

	return &DomainReconciler{
		BaseReconciler: NewBaseReconciler(mgr, "Domain"),
		ctx:            context.Background(),
		// dnsMgr:         dnsMgr,
	}
}

// +kubebuilder:rbac:groups=core.kalm.dev,resources=domains,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kalm.dev,resources=domains/status,verbs=get;update;patch

func (r *DomainReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	_ = r.Log.WithValues("domain", req.NamespacedName)
	return ctrl.Result{}, nil
}

func (r *DomainReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.Domain{}).
		Complete(r)
}
