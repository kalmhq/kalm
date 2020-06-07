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
	v1 "k8s.io/api/storage/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"strings"

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

func NewKappPVCReconciler(mgr ctrl.Manager) *KappPVCReconciler {
	return &KappPVCReconciler{
		BaseReconciler: NewBaseReconciler(mgr, "KappPVC"),
		ctx:            context.Background(),
	}
}

// +kubebuilder:rbac:groups="",resources=persistentvolumeclaims,verbs=get;list;watch;create;update;patch;delete

func (r *KappPVCReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()
	log := r.Log.WithValues("kapppvc", req.NamespacedName)

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

	// 3. prepare storage class
	cloudProvider, ok := r.tryFindCurrentCloudProvider()
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

func (r *KappPVCReconciler) tryFindCurrentCloudProvider() (string, bool) {
	var nodeList corev1.NodeList
	err := r.List(r.ctx, &nodeList)
	if err != nil {
		return "", false
	}

	for _, node := range nodeList.Items {
		if isGoogleNode(node) {
			return "gcp", true
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

func (r *KappPVCReconciler) reconcileDefaultStorageClass(cloudProvider string) error {
	var expectedStorageClasses []v1.StorageClass

	reclaimPolicy := corev1.PersistentVolumeReclaimRetain
	switch cloudProvider {
	//todo case "minikube":
	case "aws":
		hdd := v1.StorageClass{
			ObjectMeta: ctrl.ObjectMeta{
				Name: "kapp-hdd",
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
				Name: "kapp-hdd",
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
				Name: "kapp-ssd",
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
	default:
		r.Log.Info("unknown cloudProvider", "cloudProvider:", cloudProvider)
		return nil
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

			if err := r.Update(r.ctx, &expectedSC); err != nil {
				return err
			}
		}
	}

	return nil
}
