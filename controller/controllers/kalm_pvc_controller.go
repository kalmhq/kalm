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
	corev1 "k8s.io/api/core/v1"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/source"
)

const (
	KalmLabelPV      = "kalm-pv"
	KalmLabelManaged = "kalm-managed"
)

// KalmPVCReconciler reconciles a KalmPVC object
type KalmPVCReconciler struct {
	*BaseReconciler
	ctx context.Context
}

func NewKalmPVCReconciler(mgr ctrl.Manager) *KalmPVCReconciler {
	return &KalmPVCReconciler{
		BaseReconciler: NewBaseReconciler(mgr, "KalmPVC"),
		ctx:            context.Background(),
	}
}

// +kubebuilder:rbac:groups="",resources=persistentvolumeclaims,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="",resources=persistentvolumes,verbs=get;list;watch;create;update;patch;delete

func (r *KalmPVCReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	r.Log.Info("reconciling kalmPvc volumes", "req", req)

	ctx := context.Background()
	log := r.Log.WithValues("kalmpvc", req.NamespacedName)

	var kalmPVList corev1.PersistentVolumeList
	if err := r.List(ctx, &kalmPVList, client.MatchingLabels{KalmLabelManaged: "true"}); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	// for all kalm PV in Released stats, clean claimRef to make it available again
	for _, kalmPV := range kalmPVList.Items {
		if kalmPV.Status.Phase != corev1.VolumeReleased {
			continue
		}

		if kalmPV.Spec.ClaimRef != nil {
			kalmPV.Spec.ClaimRef = nil

			if err := r.Update(ctx, &kalmPV); err != nil {
				return ctrl.Result{}, nil
			}
		}
	}

	// make sure for each active kalmPvc, underlying kalmPV is labeled with its name
	// (to be selected using selector)
	var pvList corev1.PersistentVolumeList
	if err := r.List(ctx, &pvList); client.IgnoreNotFound(err) != nil {
		return ctrl.Result{}, err
	}

	var kalmPvcList corev1.PersistentVolumeClaimList
	err := r.List(ctx, &kalmPvcList, client.MatchingLabels{KalmLabelManaged: "true"})
	if client.IgnoreNotFound(err) != nil {
		return ctrl.Result{}, err
	}

	for _, pv := range pvList.Items {
		kalmPVC, isRefed := isReferencedByKalmPVC(pv, kalmPvcList)
		if !isRefed {
			log.Info("pv is not refed, skipped", "pv:", pv.Name)
			continue
		}

		if pv.Labels == nil {
			pv.Labels = make(map[string]string)
		}

		pv.Labels[KalmLabelManaged] = "true"
		pv.Labels[KalmLabelComponentKey] = kalmPVC.Labels[KalmLabelComponentKey]
		pv.Labels[KalmLabelNamespaceKey] = kalmPVC.Labels[KalmLabelNamespaceKey]
		// to be selectable by PVC
		pv.Labels[KalmLabelPV] = pv.Name

		if err := r.Update(ctx, &pv); err != nil {
			return ctrl.Result{}, err
		}
	}

	return ctrl.Result{}, nil
}

func isReferencedByKalmPVC(
	pv corev1.PersistentVolume,
	list corev1.PersistentVolumeClaimList,
) (pvc corev1.PersistentVolumeClaim, isRefed bool) {

	for _, pvc := range list.Items {
		if pvc.Spec.VolumeName == pv.Name {
			return pvc, true
		}
	}

	return
}

func (r *KalmPVCReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1.PersistentVolumeClaim{}).
		Watches(
			&source.Kind{Type: &corev1.PersistentVolume{}},
			&handler.EnqueueRequestsFromMapFunc{ToRequests: MapAll{}},
		).
		Complete(r)
}
