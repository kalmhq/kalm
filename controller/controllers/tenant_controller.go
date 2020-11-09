package controllers

import (
	"context"
	"strconv"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

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

	//todo sort components by priority, return components that resource sum won't exceed quota
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
	//todo
	return nil
}

func existGreaterResourceInList(resList1, resList2 v1alpha1.ResourceList) bool {
	//todo
	return false
}

func estimateResourceConsumption(component v1alpha1.Component) v1alpha1.ResourceList {
	//todo
	return nil
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
