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
	"github.com/kalm-staging/kalm/controller/api/v1alpha1"
	corev1 "k8s.io/api/core/v1"
	v1 "k8s.io/api/storage/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/source"
	"strings"
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

// +kubebuilder:rbac:groups=core.kalm.dev,resources=components,verbs=get;list;watch
// +kubebuilder:rbac:groups="",resources=persistentvolumeclaims,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="",resources=persistentvolumes,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="",resources=nodes,verbs=get;list;watch
// +kubebuilder:rbac:groups=storage.k8s.io,resources=storageclasses,verbs=get;list;watch;create;update;patch;delete

func (r *KalmPVCReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	r.Log.Info("reconciling kalmPvc volumes", "req", req)

	ctx := context.Background()
	log := r.Log.WithValues("kalmpvc", req.NamespacedName)

	// 1. check if any Component is using this kalmPvc, if not delete it
	// todo skip delete if reclaim policy of kalmPV is not Retain
	//      or if storage class of PV is not Kalm-Managed
	var kalmPvcList corev1.PersistentVolumeClaimList
	err := r.List(ctx, &kalmPvcList, client.MatchingLabels{KalmLabelManaged: "true"})
	if client.IgnoreNotFound(err) != nil {
		//fmt.Println("unexpected err:", err)
		return ctrl.Result{}, err
	}

	//fmt.Println("kalmPVC:", len(kalmPvcList.Items), kalmPvcList.Items)

	var componentList v1alpha1.ComponentList
	if err = r.List(ctx, &componentList); err != nil {
		if !errors.IsNotFound(err) {
			return ctrl.Result{}, err
		}
	}

	//var activePVCs []corev1.PersistentVolumeClaim
	//
	//for _, kalmPvc := range kalmPvcList.Items {
	//	if _, exist := findComponentUsingPVC(kalmPvc, componentList); exist {
	//		activePVCs = append(activePVCs, kalmPvc)
	//
	//		continue
	//	}
	//
	//	// todo more careful deleting this kalmPvc
	//	r.Log.Info("deleting un-used kalmPvc", "kalmPvc", kalmPvc.Name, "comps", componentList.Items)
	//	if err := r.Delete(ctx, &kalmPvc); err != nil {
	//		return ctrl.Result{}, nil
	//	}
	//}

	// 2. PV

	var kalmPVList corev1.PersistentVolumeList
	if err := r.List(ctx, &kalmPVList, client.MatchingLabels{KalmLabelManaged: "true"}); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	// 2.1 for all kalm PV in Released stats, clean claimRef to make it available again
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

	// 2.2 make sure for each active kalmPvc, underlying kalmPV is labeled with its name
	//     (to be selected using selector)
	var pvList corev1.PersistentVolumeList
	if err := r.List(ctx, &pvList); client.IgnoreNotFound(err) != nil {
		return ctrl.Result{}, err
	}

	//fmt.Println("aaaa", len(pvList.Items), pvList.Items, req)

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

	// 3. prepare storage class
	cloudProvider, ok := r.guessCurrentCloudProvider()
	if !ok {
		log.Info("fail to find current cloudProvier")
		return ctrl.Result{}, nil
	}

	err = r.reconcileDefaultStorageClass(cloudProvider)
	if err != nil {
		return ctrl.Result{}, err
	}

	return ctrl.Result{}, nil
}

func isReferencedByKalmPVC(pv corev1.PersistentVolume, list corev1.PersistentVolumeClaimList,
) (pvc corev1.PersistentVolumeClaim, isRefed bool) {

	for _, pvc := range list.Items {
		if pvc.Spec.VolumeName == pv.Name {
			return pvc, true
		}

	}

	return
}

func findComponentUsingPVC(pvc corev1.PersistentVolumeClaim, compList v1alpha1.ComponentList) (v1alpha1.Component, bool) {
	for _, comp := range compList.Items {

		if pvc.Namespace != comp.Namespace {
			continue
		}

		for _, vol := range comp.Spec.Volumes {
			if vol.Type != v1alpha1.VolumeTypePersistentVolumeClaim {
				continue
			}

			if !isStatefulSet(&comp) && vol.PVC == pvc.Name {
				return comp, true
			}

			pvcNamePrefix := fmt.Sprintf("%s-%s-", vol.PVC, comp.Name)
			if isStatefulSet(&comp) && strings.HasPrefix(pvc.Name, pvcNamePrefix) {
				return comp, true
			}
		}
	}

	return v1alpha1.Component{}, false
}

func (r *KalmPVCReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		//For(&corev1.PersistentVolume{}).
		//For(&v1.StorageClass{}).
		For(&corev1.PersistentVolumeClaim{}).
		Watches(
			&source.Kind{Type: &corev1.PersistentVolumeClaim{}},
			&handler.EnqueueRequestForObject{},
		).
		//For(&v1alpha1.Component{}).
		Watches(
			&source.Kind{Type: &v1alpha1.Component{}},
			&handler.EnqueueRequestForObject{},
		).
		Watches(
			&source.Kind{Type: &corev1.PersistentVolume{}},
			&handler.EnqueueRequestForObject{},
		).
		Watches(
			&source.Kind{Type: &v1.StorageClass{}},
			&handler.EnqueueRequestForObject{},
		).
		Complete(r)
}

func (r *KalmPVCReconciler) guessCurrentCloudProvider() (string, bool) {
	var nodeList corev1.NodeList
	err := r.List(r.ctx, &nodeList)
	if err != nil {
		return "", false
	}

	for _, node := range nodeList.Items {
		if isGoogleNode(node) {
			return "gcp", true
		}

		if isMinikube(node) {
			return "minikube", true
		}
		// todo, more for minikube & aws & azure
	}

	return "", false
}

func isGoogleNode(node corev1.Node) bool {
	if strings.Contains(node.Name, "gke") {
		return true
	}

	gkeLabels := []string{
		"cloud.google.com/gke-nodepool",
		"cloud.google.com/gke-os-distribution",
	}

	for _, gkeLabel := range gkeLabels {
		if _, exist := node.Labels[gkeLabel]; exist {
			return true
		}
	}

	return false
}

func isMinikube(node corev1.Node) bool {
	if node.Name == "minikube" {
		return true
	}

	return false
}

const (
	KalmAnnoSCDocLink   = "kalm-annotation-sc-doc-link"
	KalmAnnoSCPriceLink = "kalm-annotation-sc-price-link"
)

func (r *KalmPVCReconciler) reconcileDefaultStorageClass(cloudProvider string) error {
	var expectedStorageClasses []v1.StorageClass

	reclaimPolicy := corev1.PersistentVolumeReclaimRetain
	switch cloudProvider {
	//todo case "minikube":
	case "aws":
		hdd := v1.StorageClass{
			ObjectMeta: ctrl.ObjectMeta{
				Name: "kalm-hdd",
				Annotations: map[string]string{
					KalmAnnoSCDocLink:   "todo",
					KalmAnnoSCPriceLink: "todo",
				},
			},
			Provisioner:   "kubernetes.io/aws-ebs",
			ReclaimPolicy: &reclaimPolicy,
			Parameters: map[string]string{
				"type":   "gp2",
				"fstype": "ext4",
			},
		}

		//todo ssd

		expectedStorageClasses = []v1.StorageClass{hdd}
	case "azure":

		//todo

	case "gcp":
		hdd := v1.StorageClass{
			ObjectMeta: ctrl.ObjectMeta{
				Name: "kalm-hdd",
				Annotations: map[string]string{
					KalmAnnoSCDocLink:   "https://cloud.google.com/compute/docs/disks#pdspecs",
					KalmAnnoSCPriceLink: "https://cloud.google.com/compute/disks-image-pricing#disk",
				},
			},
			Provisioner:   "kubernetes.io/gce-pd",
			ReclaimPolicy: &reclaimPolicy,
			Parameters: map[string]string{
				"type":             "pd-standard",
				"fstype":           "ext4",
				"replication-type": "none",
			},
		}
		ssd := v1.StorageClass{
			ObjectMeta: ctrl.ObjectMeta{
				Name: "kalm-ssd",
			},
			Provisioner:   "kubernetes.io/gce-pd",
			ReclaimPolicy: &reclaimPolicy,
			Parameters: map[string]string{
				"type":             "pd-ssd",
				"fstype":           "ext4",
				"replication-type": "none",
			},
		}

		expectedStorageClasses = []v1.StorageClass{hdd, ssd}
	case "minikube":
		std := v1.StorageClass{
			ObjectMeta: ctrl.ObjectMeta{
				Name: "kalm-standard",
				Annotations: map[string]string{
					KalmAnnoSCDocLink: "https://minikube.sigs.k8s.io/docs/handbook/persistent_volumes/",
				},
			},
			Provisioner:   "k8s.io/minikube-hostpath",
			ReclaimPolicy: &reclaimPolicy,
		}

		expectedStorageClasses = []v1.StorageClass{std}
	default:
		r.Log.Info("unknown cloudProvider", "cloudProvider:", cloudProvider)
		return nil
	}

	// set labels for kalm managed storage class
	for i := 0; i < len(expectedStorageClasses); i++ {
		sc := &expectedStorageClasses[i]

		if sc.Labels == nil {
			sc.Labels = make(map[string]string)
		}

		sc.Labels[KalmLabelManaged] = "true"
	}

	for _, expectedSC := range expectedStorageClasses {
		var sc v1.StorageClass
		isNew := false

		err := r.Get(r.ctx, client.ObjectKey{Name: expectedSC.Name}, &sc)
		if err != nil {
			if !errors.IsNotFound(err) {
				return err
			}

			isNew = true
		}

		if isNew {
			if err := r.Create(r.ctx, &expectedSC); err != nil {
				return err
			}
		} else {
			sc.Parameters = expectedSC.Parameters
			sc.Provisioner = expectedSC.Provisioner
			sc.ReclaimPolicy = expectedSC.ReclaimPolicy
			sc.Annotations = mergeMap(sc.Annotations, expectedSC.Annotations)

			if err := r.Update(r.ctx, &expectedSC); err != nil {
				return err
			}
		}
	}

	return nil
}

func mergeMap(old, new map[string]string) map[string]string {
	if old == nil {
		old = make(map[string]string)
	}

	for k, v := range new {
		old[k] = v
	}

	return old
}
