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
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"sigs.k8s.io/controller-runtime/pkg/client"

	ctrl "sigs.k8s.io/controller-runtime"
)

const (
	KappPVLabelName = "kapp-pv"
)

// KappPVCReconciler reconciles a KappPVC object
type KappPVCReconciler struct {
	*BaseReconciler
	ctx context.Context
}

func NewKappPVCReconciler(mgr ctrl.Manager) KappPVCReconciler {
	return KappPVCReconciler{
		BaseReconciler: NewBaseReconciler(mgr, "KappPVC"),
		ctx:            context.Background(),
	}
}

// +kubebuilder:rbac:groups="",resources=persistentvolumeclaims,verbs=get;list;watch;create;update;patch;delete

func (r *KappPVCReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()
	_ = r.Log.WithValues("kapppvc", req.NamespacedName)

	var pvcList corev1.PersistentVolumeClaimList
	err := r.List(ctx, &pvcList, client.MatchingLabels{"kapp-managed": "true"})
	if err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	// 1. check if any Component is using this pvc, if not delete it

	var componentList v1alpha1.ComponentList
	if err = r.List(ctx, &componentList, client.InNamespace(req.Namespace)); err != nil {
		if !errors.IsNotFound(err) {
			return ctrl.Result{}, err
		}
	}

	var activePVCs []corev1.PersistentVolumeClaim
	for _, pvc := range pvcList.Items {
		if isAnyComponentUsingPVC(pvc, componentList) {
			activePVCs = append(activePVCs, pvc)
			continue
		}

		// delete this pvc
		if err := r.Delete(ctx, &pvc); err != nil {
			return ctrl.Result{}, nil
		}
	}

	// 2. make sure for each active pvc, underlying pv is labeled with its name
	//    (to be selected using selector)
	var pvList corev1.PersistentVolumeList
	if err := r.List(ctx, &pvList); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	for _, activePVC := range activePVCs {
		for _, pv := range pvList.Items {
			if pv.Name != activePVC.Spec.VolumeName {
				continue
			}

			if pv.Labels == nil {
				pv.Labels = make(map[string]string)
			}

			pv.Labels[KappPVLabelName] = pv.Name
			if err := r.Update(ctx, &pv); err != nil {
				return ctrl.Result{}, err
			}
		}
	}

	return ctrl.Result{}, nil
}

func isAnyComponentUsingPVC(pvc corev1.PersistentVolumeClaim, compList v1alpha1.ComponentList) bool {
	for _, comp := range compList.Items {
		for _, vol := range comp.Spec.Volumes {
			if vol.Type != v1alpha1.VolumeTypePersistentVolumeClaim {
				continue
			}

			if vol.PersistentVolumeClaimName == pvc.Name {
				return true
			}
		}
	}

	return false
}

func (r *KappPVCReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1.PersistentVolumeClaim{}).
		Complete(r)
}
