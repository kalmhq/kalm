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
	"k8s.io/apimachinery/pkg/api/errors"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
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

	pvc := corev1.PersistentVolumeClaim{}
	err := r.Get(r.ctx, client.ObjectKey{Name: req.Name, Namespace: req.Namespace}, &pvc)
	if err != nil {
		if !errors.IsNotFound(err) {
			return ctrl.Result{}, err
		}
	}

	// ignore if pvc is not deleted
	pvcIsDeleted := errors.IsNotFound(err)
	if !pvcIsDeleted {
		return ctrl.Result{}, nil
	}

	// for every deletion of pvc, loop to make unbounded pv available again

	var kalmPVList corev1.PersistentVolumeList
	if err := r.List(r.ctx, &kalmPVList, client.MatchingLabels{KalmLabelManaged: "true"}); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	// clean claimRef to make it available again
	for _, pv := range kalmPVList.Items {

		claimRef := pv.Spec.ClaimRef

		if claimRef == nil {
			continue
		}

		// ignore if claimRef is not this deleted PVC
		if claimRef.Namespace != req.Namespace ||
			claimRef.Name != req.Name {
			continue
		}

		pv.Spec.ClaimRef = nil
		if err := r.Update(r.ctx, &pv); err != nil {
			return ctrl.Result{}, nil
		}
	}

	return ctrl.Result{}, nil
}

func (r *KalmPVCReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1.PersistentVolumeClaim{}).
		Complete(r)
}
