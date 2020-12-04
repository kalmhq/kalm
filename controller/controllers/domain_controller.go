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
	"strings"
	"time"

	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	corev1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
)

// DomainReconciler reconciles a Domain object
type DomainReconciler struct {
	*BaseReconciler
	ctx context.Context
}

func NewDomainReconciler(mgr ctrl.Manager) *DomainReconciler {
	return &DomainReconciler{
		BaseReconciler: NewBaseReconciler(mgr, "Domain"),
		ctx:            context.Background(),
	}
}

// +kubebuilder:rbac:groups=core.kalm.dev,resources=domains,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kalm.dev,resources=domains/status,verbs=get;update;patch

func (r *DomainReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	log := r.Log.WithValues("domain", req.NamespacedName)

	domain := v1alpha1.Domain{}
	if err := r.Get(r.ctx, client.ObjectKey{Name: req.Name}, &domain); err != nil {
		if errors.IsNotFound(err) {
			return ctrl.Result{}, nil
		}

		return ctrl.Result{}, err
	}

	// do nothing if is kalm builtin domain
	if domain.Spec.IsKalmBuiltinDomain {
		return ctrl.Result{}, nil
	}

	isConfiguredAsExpected, err := v1alpha1.IsDomainConfiguredAsExpected(domain.Spec)
	if err != nil {
		return ctrl.Result{}, err
	}

	isWildcard := isWildcardDomain(domain.Spec.Domain)

	if isConfiguredAsExpected && !isWildcard {
		// ensure https cert is ready for the domain
		httpsCert := v1alpha1.HttpsCert{}
		isNew := false

		// cert share same name as domain
		certName := domain.Name
		if err := r.Get(r.ctx, client.ObjectKey{Name: certName}, &httpsCert); err != nil {
			if errors.IsNotFound(err) {
				isNew = true
			} else {
				return ctrl.Result{}, err
			}
		}

		expectedHttpsCert := v1alpha1.HttpsCert{
			ObjectMeta: metav1.ObjectMeta{
				Name: certName,
				Labels: map[string]string{
					v1alpha1.TenantNameLabelKey: domain.Labels[v1alpha1.TenantNameLabelKey],
				},
			},
			Spec: v1alpha1.HttpsCertSpec{
				IsSelfManaged:   false,
				HttpsCertIssuer: v1alpha1.DefaultHTTP01IssuerName,
				Domains:         []string{domain.Spec.Domain},
			},
		}

		if isNew {
			httpsCert = expectedHttpsCert
			if err := r.Create(r.ctx, &httpsCert); err != nil {
				return ctrl.Result{}, err
			}
		} else {
			httpsCert.Spec = expectedHttpsCert.Spec
			if err := r.Update(r.ctx, &httpsCert); err != nil {
				return ctrl.Result{}, err
			}
		}
	}

	requeueAfter := decideRequeueAfter(domain, isConfiguredAsExpected)

	copied := domain.DeepCopy()

	if isConfiguredAsExpected {
		copied.Status.IsDNSTargetConfigured = true

		if copied.Status.CheckCountSinceCNAMEReadyUpdated > 0 {
			//reset
			copied.Status.CheckCountSinceCNAMEReadyUpdated = 0
		}
	} else {
		// for ready change to not-ready, only set to failed for 10 times
		if copied.Status.IsDNSTargetConfigured {
			copied.Status.CheckCountSinceCNAMEReadyUpdated += 1

			threshold := 10
			if copied.Status.CheckCountSinceCNAMEReadyUpdated > threshold {
				copied.Status.IsDNSTargetConfigured = false
			}
		}
	}

	if err := r.Status().Update(r.ctx, copied); err != nil {
		return ctrl.Result{}, err
	}

	// this reconcile act as a never ending loop to check if Domain config is Valid
	log.Info("requeue check of Domain", "after", requeueAfter)
	return ctrl.Result{RequeueAfter: requeueAfter}, nil
}

func isWildcardDomain(domain string) bool {
	return strings.HasPrefix(domain, "*")
}

// decide time of next re-check
func decideRequeueAfter(domain v1alpha1.Domain, isReady bool) time.Duration {
	if isReady {
		return 60 * time.Second
	} else {
		return 5 * time.Second
	}

	// wasReady := domain.Status.CNAMEReady
	// if wasReady {
	// 	// still ok
	// 	if isReady {
	// 		return 1 * time.Hour
	// 	}

	// 	// ok -> not ok, quick check again
	// 	return 10 * time.Second
	// } else {
	// 	// not ok -> ok, quick check again
	// 	if isReady {
	// 		return 10 * time.Second
	// 	}

	// 	// still not ok
	// 	checkCount := domain.Status.CheckCountSinceCNAMEReadyUpdated
	// 	if checkCount <= 10 {
	// 		return 10 * time.Second
	// 	} else if checkCount <= 20 {
	// 		return 20 * time.Second
	// 	} else if checkCount <= 30 {
	// 		return 30 * time.Second
	// 	} else if checkCount <= 60 {
	// 		return 1 * time.Minute
	// 	} else {
	// 		return 1 * time.Hour
	// 	}
	// }
}

func (r *DomainReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.Domain{}).
		Complete(r)
}
