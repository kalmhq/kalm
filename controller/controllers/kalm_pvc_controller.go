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
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
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
// +kubebuilder:rbac:groups="",resources=pods,verbs=get;list;watch

func (r *KalmPVCReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	r.Log.Info("reconciling kalmPvc volumes", "req", req)

	pvc := corev1.PersistentVolumeClaim{}
	err := r.Get(r.ctx, client.ObjectKey{Name: req.Name, Namespace: req.Namespace}, &pvc)
	if err != nil {
		if !errors.IsNotFound(err) {
			return ctrl.Result{}, err
		}

		return ctrl.Result{}, nil
	}

	// check if owner of pvc has changed
	return ctrl.Result{}, r.reconcileForPVCOwnerChange(pvc)
}

// if owner component changed, update PVC label
func (r *KalmPVCReconciler) reconcileForPVCOwnerChange(pvc corev1.PersistentVolumeClaim) error {

	// list pods in current ns, check if any is using this pvc
	var podList corev1.PodList
	err := r.List(r.ctx, &podList, client.MatchingLabels{KalmLabelManaged: "true"})
	if err != nil {
		return err
	}

	for _, pod := range podList.Items {
		for _, vol := range pod.Spec.Volumes {
			volClaim := vol.PersistentVolumeClaim
			if volClaim == nil {
				continue
			}

			if volClaim.ClaimName != pvc.Name {
				continue
			}

			expectedNS := pod.Namespace
			expectedComp := pod.Labels[KalmLabelComponentKey]

			copiedPVC := pvc.DeepCopy()
			if copiedPVC.Labels == nil {
				copiedPVC.Labels = make(map[string]string)
			}

			copiedPVC.Labels[KalmLabelComponentKey] = expectedComp
			copiedPVC.Labels[KalmLabelNamespaceKey] = expectedNS
			copiedPVC.Labels[KalmLabelManaged] = "true"

			err := r.Update(r.ctx, copiedPVC)
			return err
		}
	}

	return nil
}

type PodMapperForPVC struct {
	*BaseReconciler
}

func (c PodMapperForPVC) Map(object handler.MapObject) []reconcile.Request {

	if v, exist := object.Meta.GetLabels()[KalmLabelManaged]; !exist || v != "true" {
		return nil
	}

	var pod corev1.Pod
	podKey := client.ObjectKey{
		Namespace: object.Meta.GetNamespace(),
		Name:      object.Meta.GetName(),
	}
	err := c.Get(context.Background(), podKey, &pod)
	if err != nil {
		return nil
	}

	var rst []reconcile.Request
	for _, vol := range pod.Spec.Volumes {
		if vol.PersistentVolumeClaim == nil {
			continue
		}

		rst = append(rst, reconcile.Request{NamespacedName: types.NamespacedName{
			Namespace: pod.Namespace,
			Name:      vol.PersistentVolumeClaim.ClaimName,
		}})
	}

	return rst
}

func (r *KalmPVCReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1.PersistentVolumeClaim{}).
		Watches(genSourceForObject(&corev1.Pod{}), &handler.EnqueueRequestsFromMapFunc{
			ToRequests: PodMapperForPVC{r.BaseReconciler},
		}).
		Complete(r)
}
