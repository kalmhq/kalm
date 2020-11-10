package controllers

import (
	"context"
	"fmt"
	"sort"
	"strconv"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
)

var tenantCtrlLog = logf.Log.WithName("tenant-controller")

type TenantReconciler struct {
	*BaseReconciler
	ctx context.Context
}

func NewTenantReconciler(mgr ctrl.Manager) *TenantReconciler {
	return &TenantReconciler{
		BaseReconciler: NewBaseReconciler(mgr, "Tenant"),
		ctx:            context.Background(),
	}
}

func (r *TenantReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&v1alpha1.Tenant{}).
		Complete(r)
}

func (r *TenantReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	tenantName := req.Name

	logger := r.Log.WithValues("tenant", tenantName)

	logger.Info("reconciling tenant")

	var tenant v1alpha1.Tenant
	err := r.Get(r.ctx, client.ObjectKey{Name: tenantName}, &tenant)
	if err != nil {
		if errors.IsNotFound(err) {
			return ctrl.Result{}, nil
		} else {
			return ctrl.Result{}, err
		}
	}

	surplusResource, noNegative := getSurplusResource(tenant)

	if noNegative {
		r.Log.Info("see surplusResource, will re-schedule exceedingQuota component if exist any", "res", surplusResource)

		// if enough quota, check if any component is labeled with ExceedingQuota
		components, err := r.findComponentsToSchedule(tenant.Name, surplusResource)
		if err != nil {
			return ctrl.Result{}, err
		}

		for _, comp := range components {
			if err := r.tryReScheduleExceedingQuotaComponent(comp.DeepCopy()); err != nil {
				return ctrl.Result{}, err
			}
		}

		r.Log.Info("removed exceedingQuota label for components", "size", len(components))
	} else {
		r.Log.Info("see exceeding quota, will stop components to reduce resource usage", "res", surplusResource)

		// if exceeding quota, find component to stop
		components, err := r.findComponentsToStop(tenant.Name, surplusResource)
		if err != nil {
			return ctrl.Result{}, err
		}

		for _, comp := range components {
			if err := r.tryMarkComponentAsExceedingQuota(comp.DeepCopy()); err != nil {
				return ctrl.Result{}, err
			}
		}
	}

	return ctrl.Result{}, nil
}

func getSurplusResource(tenant v1alpha1.Tenant) (rst v1alpha1.ResourceList, noNegative bool) {
	rst = make(v1alpha1.ResourceList)
	noNegative = true

	for resName, quantity := range tenant.Spec.ResourceQuota {
		if usedQuantity, exist := tenant.Status.UsedResourceQuota[resName]; exist {
			quantity.Sub(usedQuantity)
		}

		rst[resName] = quantity

		zero := resource.Quantity{}
		if quantity.Cmp(zero) < 0 {
			noNegative = false
		}
	}

	return
}

func (r *TenantReconciler) findComponentsToSchedule(tenant string, surplusResource v1alpha1.ResourceList) ([]v1alpha1.Component, error) {
	var compList v1alpha1.ComponentList
	err := r.List(r.ctx, &compList, client.MatchingLabels{
		v1alpha1.TenantNameLabelKey:         tenant,
		v1alpha1.KalmLabelKeyExceedingQuota: "true",
	})
	if err != nil {
		return nil, err
	}

	var compToReschedule []v1alpha1.Component

	//sort components by priority,
	components := compList.Items
	sort.Slice(components, func(i, j int) bool {
		return components[i].Spec.Priority < components[j].Spec.Priority
	})

	// find components that resource sum won't exceed quota
	var rescheduleSum v1alpha1.ResourceList
	for _, comp := range compList.Items {
		rescheduleSum = sumResourceList(rescheduleSum, estimateResourceConsumption(comp))

		if existGreaterResourceInList(rescheduleSum, surplusResource) {
			return compToReschedule, nil
		}

		compToReschedule = append(compToReschedule, comp)
	}

	return compToReschedule, nil
}

func sumResourceList(resLists ...v1alpha1.ResourceList) v1alpha1.ResourceList {
	var rst v1alpha1.ResourceList

	for _, resList := range resLists {
		for resName, quantity := range resList {
			existQuantity := rst[resName]
			existQuantity.Add(quantity)

			rst[resName] = existQuantity
		}
	}

	return rst
}

// existGreaterResource in resList than baseResList
func existGreaterResourceInList(resList, baseResList v1alpha1.ResourceList) bool {
	for resName, quantity := range resList {
		baseQuantity := baseResList[resName]

		if quantity.Cmp(baseQuantity) > 0 {
			return true
		}
	}

	return false
}

func estimateResourceConsumption(component v1alpha1.Component) v1alpha1.ResourceList {

	// component must have spec.ResourceRequirements.Limits
	if component.Spec.ResourceRequirements == nil ||
		component.Spec.ResourceRequirements.Limits == nil {

		tenantCtrlLog.Error(fmt.Errorf("see component without spec.resourceRequirements.limits"), "component webhook should guarantee this")
		return nil
	}

	var resList v1alpha1.ResourceList

	var replicas int
	if component.Spec.Replicas == nil {
		replicas = 1
	} else {
		replicas = int(*component.Spec.Replicas)
	}

	// pods resource consumption
	for resName, quantity := range component.Spec.ResourceRequirements.Limits {
		switch resName {
		case v1.ResourceCPU:
			incResource(resList, v1alpha1.ResourceCPU, multiQuantity(quantity, replicas))
		case v1.ResourceMemory:
			incResource(resList, v1alpha1.ResourceMemory, multiQuantity(quantity, replicas))
		default:
			tenantCtrlLog.Info("see Resource in component not handled", "resource", resName)
		}
	}

	// storage, disk & memory
	for _, vol := range component.Spec.Volumes {
		switch vol.Type {
		case v1alpha1.VolumeTypePersistentVolumeClaim:

			if vol.PVToMatch != "" {
				// trying to re-use disk, ignored
				continue
			}

			incResource(resList, v1alpha1.ResourceStorage, multiQuantity(vol.Size, replicas))

		case v1alpha1.VolumeTypePersistentVolumeClaimTemplate:

			//todo re-use case not handled
			incResource(resList, v1alpha1.ResourceStorage, multiQuantity(vol.Size, replicas))

		case v1alpha1.VolumeTypeTemporaryMemory:

			incResource(resList, v1alpha1.ResourceCPU, multiQuantity(vol.Size, replicas))

		case v1alpha1.VolumeTypeTemporaryDisk:

			tenantCtrlLog.Info("see using tmpDisk, should be disabled for SaaS version")

		case v1alpha1.VolumeTypeHostPath:

			tenantCtrlLog.Info("see using hostPath, should be disabled for SaaS version")

		}
	}

	// istio sidecar resource consumption
	for resName, quantity := range component.Spec.IstioResourceRequirements.Limits {
		switch resName {
		case v1.ResourceCPU:
			incResource(resList, v1alpha1.ResourceCPU, multiQuantity(quantity, replicas))
		case v1.ResourceMemory:
			incResource(resList, v1alpha1.ResourceMemory, multiQuantity(quantity, replicas))
		case v1.ResourceEphemeralStorage:
			incResource(resList, v1alpha1.ResourceEphemeralStorage, multiQuantity(quantity, replicas))
		default:
			tenantCtrlLog.Info("see Resource in component not handled", "resource", resName)
		}
	}

	return nil
}

func incResource(resList v1alpha1.ResourceList, resName v1alpha1.ResourceName, deltaQuantity resource.Quantity) {
	newQuantity := resList[resName]
	newQuantity.Add(deltaQuantity)

	resList[resName] = newQuantity
}

//todo
func multiQuantity(quantity resource.Quantity, cnt int) resource.Quantity {
	for i := 0; i < cnt; i++ {
		quantity.Add(quantity)
	}

	return quantity
}

func (r *TenantReconciler) findComponentsToStop(tenant string, surplusResource v1alpha1.ResourceList) ([]v1alpha1.Component, error) {
	var compList v1alpha1.ComponentList
	err := r.List(r.ctx, &compList, client.MatchingLabels{
		v1alpha1.TenantNameLabelKey: tenant,
	})
	if err != nil {
		return nil, err
	}

	for _, comp := range compList.Items {
		if comp.Labels != nil &&
			comp.Labels[v1alpha1.KalmLabelKeyExceedingQuota] == "true" {
			continue
		}

		// todo fix this
		return []v1alpha1.Component{comp}, nil
	}

	return nil, nil
}

func (r *TenantReconciler) tryReScheduleExceedingQuotaComponent(comp *v1alpha1.Component) error {
	if comp.Labels == nil {
		return nil
	}

	// clean exceeding quota label
	delete(comp.Labels, v1alpha1.KalmLabelKeyExceedingQuota)

	// restore replicas
	originalReplicasStr := comp.Labels[v1alpha1.KalmLabelKeyOriginalReplicas]
	originalReplicas, err := strconv.ParseInt(originalReplicasStr, 10, 32)
	if err != nil {
		originalReplicas = 0
	}

	replicas := int32(originalReplicas)
	comp.Spec.Replicas = &replicas

	// clean original replicas label
	delete(comp.Labels, v1alpha1.KalmLabelKeyOriginalReplicas)

	return r.Update(r.ctx, comp)
}

func (r *TenantReconciler) tryMarkComponentAsExceedingQuota(comp *v1alpha1.Component) error {
	if comp.Labels == nil {
		comp.Labels = make(map[string]string)
	}

	comp.Labels[v1alpha1.KalmLabelKeyExceedingQuota] = "true"

	return r.Update(r.ctx, comp)
}
