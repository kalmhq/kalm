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
	"fmt"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
)

type KalmPVReconciler struct {
	*BaseReconciler
	ctx context.Context
}

const (
	KalmLabelCleanIfPVCGone = "clean-if-claimed-pvc-gone"
	KalmLabelPVLocker       = "kalm-pv-locker"
	ControllerKalmPV        = "controller-kalm-pv"
)

// this controller's task is to ensure all Kalm PVs are labeled with kalm-pv
// this is done when PV is created
// and PVC change won't affect this, so no need to watch PVC here
func NewKalmPVReconciler(mgr ctrl.Manager) *KalmPVReconciler {
	return &KalmPVReconciler{
		BaseReconciler: NewBaseReconciler(mgr, "KalmPV"),
		ctx:            context.Background(),
	}
}

// +kubebuilder:rbac:groups="",resources=persistentvolumeclaims,verbs=get;list;watch
// +kubebuilder:rbac:groups="",resources=persistentvolumes,verbs=get;list;watch;create;update;patch;delete

func (r *KalmPVReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	r.Log.Info("reconciling kalmPV", "req", req)

	// special ns triggers check of pv need to be cleaned
	if req.Namespace == NSForPVCChanged {
		return ctrl.Result{}, r.reconcileForPVCChange()
	} else {
		return ctrl.Result{}, r.reconcilePV(req.Name)
	}
}

type PVCMapper struct {
	*BaseReconciler
}

func (r *KalmPVReconciler) reconcileForPVCChange() error {
	var pvList corev1.PersistentVolumeList
	matchingLabels := client.MatchingLabels{KalmLabelManaged: "true"}

	if err := r.List(r.ctx, &pvList, matchingLabels); err != nil {
		return err
	}

	err := r.reconcileDeleteOfPVWithSpecialCleanLabel(pvList)
	if err != nil {
		return err
	}

	err = r.reconcileOrphanPVs(pvList)
	return err
}

// list all kalm-managed pv
// if 1. labeled with: clean-if-pvc-deleted
//    2. pvc is gone
// then delete this pv
func (r *KalmPVReconciler) reconcileDeleteOfPVWithSpecialCleanLabel(kalmPVList corev1.PersistentVolumeList) error {
	r.Log.Info("reconcileDeleteOfPVWithSpecialCleanLabel")

	for i := range kalmPVList.Items {
		pv := kalmPVList.Items[i]

		pvcNsAndName, exist := pv.Labels[KalmLabelCleanIfPVCGone]
		if !exist {
			continue
		}

		claimRef := pv.Spec.ClaimRef
		if claimRef == nil {
			continue
		}

		ns := claimRef.Namespace
		name := claimRef.Name

		expectedPVCNsAndName := fmt.Sprintf("%s-%s", ns, name)
		if pvcNsAndName != expectedPVCNsAndName {
			r.Log.Info("pv clean label not match expected, skip deletion",
				KalmLabelCleanIfPVCGone, pvcNsAndName, "expected", expectedPVCNsAndName)
			continue
		}

		//check pvc
		var pvc corev1.PersistentVolumeClaim
		err := r.Get(r.ctx, client.ObjectKey{Namespace: ns, Name: name}, &pvc)
		if err != nil {
			if !errors.IsNotFound(err) {
				return err
			}

			// PVC is gone, this pv need to be cleaned too
			if err := r.Delete(r.ctx, &pv); err != nil {
				return err
			}

			r.Log.Info("deleted pv with clean mark:"+pv.Name, KalmLabelCleanIfPVCGone, pvcNsAndName)
		}
	}

	return nil
}

// make sure for each active kalmPVC, underlying kalmPV is labeled with its name
// (to be selected using selector)
func (r *KalmPVReconciler) reconcilePV(pvName string) error {

	var pv corev1.PersistentVolume
	if err := r.Get(r.ctx, client.ObjectKey{Name: pvName}, &pv); err != nil {
		return client.IgnoreNotFound(err)
	}

	claimRef := pv.Spec.ClaimRef
	if claimRef == nil {
		return nil
	}

	var pvc corev1.PersistentVolumeClaim
	err := r.Get(r.ctx, client.ObjectKey{Namespace: claimRef.Namespace, Name: claimRef.Name}, &pvc)
	if err != nil {
		if errors.IsNotFound(err) {
			// pvc not exist
			return r.reconcileOrphanPV(&pv)
		} else {
			return err
		}
	}

	// ignore if pvc is not kalm managed
	if v, exist := pvc.Labels[KalmLabelManaged]; !exist || v != "true" {
		return nil
	}

	if pv.Labels == nil {
		pv.Labels = make(map[string]string)
	}

	pv.Labels[KalmLabelManaged] = "true"
	// descriptive information
	pv.Labels[v1alpha1.KalmLabelComponentKey] = pvc.Labels[v1alpha1.KalmLabelComponentKey]
	pv.Labels[v1alpha1.KalmLabelNamespaceKey] = pvc.Labels[v1alpha1.KalmLabelNamespaceKey]
	// to be selectable by PV
	pv.Labels[KalmLabelPV] = pv.Name

	// bounded pvc exist, safe to clean locker label
	delete(pv.Labels, KalmLabelPVLocker)

	if err := r.Update(r.ctx, &pv); err != nil {
		return err
	}

	return nil
}

const (
	NSForPVCChanged = "special-ns-as-signal-for-pvc-changed"
)

func (m PVCMapper) Map(obj handler.MapObject) []reconcile.Request {
	if v, exist := obj.Meta.GetLabels()[KalmLabelManaged]; !exist || v != "true" {
		return nil
	}

	return []reconcile.Request{
		{
			NamespacedName: types.NamespacedName{
				Namespace: NSForPVCChanged,
			},
		},
	}
}

func (r *KalmPVReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1.PersistentVolume{}).
		Watches(genSourceForObject(&corev1.PersistentVolumeClaim{}), &handler.EnqueueRequestsFromMapFunc{
			ToRequests: &PVCMapper{r.BaseReconciler},
		}).
		Complete(r)
}

func (r *KalmPVReconciler) reconcileOrphanPVs(kalmPVList corev1.PersistentVolumeList) error {
	pvClaimNSMap := make(map[string]interface{})
	for _, pv := range kalmPVList.Items {
		if pv.Spec.ClaimRef == nil {
			continue
		}

		pvClaimNSMap[pv.Spec.ClaimRef.Namespace] = true
	}

	notExistNSMap := make(map[string]interface{})
	for nsName := range pvClaimNSMap {
		var ns corev1.Namespace
		err := r.Get(r.ctx, client.ObjectKey{Name: nsName}, &ns)
		if err != nil {
			if errors.IsNotFound(err) {
				notExistNSMap[nsName] = true
			} else {
				return err
			}
		}
	}

	// find orphan pvs
	var orphanPVs []*corev1.PersistentVolume
	for _, pv := range kalmPVList.Items {

		if pv.Spec.ClaimRef == nil {
			orphanPVs = append(orphanPVs, pv.DeepCopy())
			continue
		}

		pvNS := pv.Spec.ClaimRef.Namespace
		if _, isInMap := notExistNSMap[pvNS]; isInMap {
			orphanPVs = append(orphanPVs, pv.DeepCopy())
		}
	}

	// reconcile pvc for orphan pv
	for _, orphan := range orphanPVs {
		err := r.reconcileOrphanPV(orphan)
		if err != nil {
			return err
		}
	}

	return nil
}

func (r *KalmPVReconciler) reconcileOrphanPV(orphanPV *corev1.PersistentVolume) error {
	if orphanPV.Labels[KalmLabelManaged] != "true" ||
		orphanPV.Labels[KalmLabelCleanIfPVCGone] != "" {
		return nil
	}

	locker := orphanPV.Labels[KalmLabelPVLocker]
	// locker of pv exist, ignored
	if locker != "" && locker != ControllerKalmPV {
		return nil
	}

	pvcName := fmt.Sprintf("pvc-orphan-%s", orphanPV.Name)

	r.Log.Info("reconcileOrphanPV", "pvcName", pvcName)

	expectedPVC := corev1.PersistentVolumeClaim{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      pvcName,
			Namespace: KalmSystemNamespace,
			Labels: map[string]string{
				KalmLabelManaged:               "true",
				v1alpha1.KalmLabelComponentKey: orphanPV.Labels[v1alpha1.KalmLabelComponentKey],
				v1alpha1.KalmLabelNamespaceKey: orphanPV.Labels[v1alpha1.KalmLabelNamespaceKey],
			},
		},
		Spec: corev1.PersistentVolumeClaimSpec{
			AccessModes: []corev1.PersistentVolumeAccessMode{corev1.ReadWriteOnce},
			Resources: corev1.ResourceRequirements{
				Requests: corev1.ResourceList{
					corev1.ResourceStorage: *orphanPV.Spec.Capacity.Storage(),
				},
			},
			StorageClassName: &orphanPV.Spec.StorageClassName,
			Selector: &metaV1.LabelSelector{
				MatchLabels: map[string]string{
					KalmLabelPV: orphanPV.Name,
				},
			},
		},
	}

	// clean claim on PV
	pvClaim := orphanPV.Spec.ClaimRef
	if pvClaim != nil &&
		pvClaim.Namespace != expectedPVC.Namespace &&
		pvClaim.Name != expectedPVC.Name {

		cleanPVToBeAvailable(orphanPV)
		err := r.Update(r.ctx, orphanPV)
		if err != nil {
			return err
		}
	}

	var pvc corev1.PersistentVolumeClaim
	var isNew bool

	err := r.Get(r.ctx, client.ObjectKey{
		Namespace: KalmSystemNamespace,
		Name:      expectedPVC.Name,
	}, &pvc)

	if err != nil {
		if errors.IsNotFound(err) {
			isNew = true
		} else {
			return err
		}
	}

	if isNew {
		pvc = expectedPVC
		r.Log.Info("creating PVC for orphan", "pvc", pvc.Name, "pv", orphanPV.Name)

		return r.Create(r.ctx, &pvc)
	} else {
		// todo ignore
		r.Log.Info("PVC for orphan exist, ignore", "pvc", pvc.Name, "pv", orphanPV.Name)
	}

	return nil
}
