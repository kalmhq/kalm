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
)

type KalmPVReconciler struct {
	*BaseReconciler
	ctx context.Context
}

// this controller's task is to ensure all Kalm PVs are labeled with kalm-pv
// this is done when PV is created
// and PVC change won't affect this, so no need to watch PVC here
func NewKalmPVReconciler(mgr ctrl.Manager) *KalmPVReconciler {
	return &KalmPVReconciler{
		BaseReconciler: NewBaseReconciler(mgr, "KalmPV"),
		ctx:            context.Background(),
	}
}

// +kubebuilder:rbac:groups="",resources=persistentvolumeclaims,verbs=get;list
// +kubebuilder:rbac:groups="",resources=persistentvolumes,verbs=get;list;watch;create;update;patch;delete

func (r *KalmPVReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	r.Log.Info("reconciling kalmPV", "req", req)

	log := r.Log.WithValues("kalmPV", req.NamespacedName)

	// make sure for each active kalmPVC, underlying kalmPV is labeled with its name
	// (to be selected using selector)
	var pv corev1.PersistentVolume
	if err := r.Get(r.ctx, client.ObjectKey{Name: req.Name}, &pv); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	var kalmPVCList corev1.PersistentVolumeClaimList
	err := r.List(r.ctx, &kalmPVCList, client.MatchingLabels{KalmLabelManaged: "true"})
	if client.IgnoreNotFound(err) != nil {
		return ctrl.Result{}, err
	}

	kalmPV, isRefed := isReferencedByKalmPVC(pv, kalmPVCList)
	if !isRefed {
		log.Info("pv is not refed, skipped", "pv:", pv.Name)
		return ctrl.Result{}, nil
	}

	if pv.Labels == nil {
		pv.Labels = make(map[string]string)
	}

	pv.Labels[KalmLabelManaged] = "true"
	pv.Labels[KalmLabelComponentKey] = kalmPV.Labels[KalmLabelComponentKey]
	pv.Labels[KalmLabelNamespaceKey] = kalmPV.Labels[KalmLabelNamespaceKey]
	// to be selectable by PV
	pv.Labels[KalmLabelPV] = pv.Name

	if err := r.Update(r.ctx, &pv); err != nil {
		return ctrl.Result{}, err
	}

	return ctrl.Result{}, nil
}

func isReferencedByKalmPVC(
	pv corev1.PersistentVolume,
	list corev1.PersistentVolumeClaimList,
) (pvc corev1.PersistentVolumeClaim, isRefed bool) {

	for _, item := range list.Items {
		if item.Spec.VolumeName == pv.Name {
			return item, true
		}
	}

	return
}

func (r *KalmPVReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1.PersistentVolume{}).
		Complete(r)
}
