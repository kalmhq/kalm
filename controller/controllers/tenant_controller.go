package controllers

import (
	"context"
	"fmt"
	"sort"
	"strconv"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"k8s.io/apimachinery/pkg/api/errors"
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

	r.reconcileDnsRecord(&tenant)
	surplusResource, noNegative := v1alpha1.GetSurplusResource(tenant)

	if noNegative {
		logger.Info("see surplusResource, will re-schedule exceedingQuota component if exist any", "surplusResource", surplusResource)

		// if enough quota, check if any component is labeled with ExceedingQuota
		components, err := r.findComponentsToSchedule(tenant.Name, surplusResource)
		if err != nil {
			return ctrl.Result{}, err
		}
		logger.Info("to remove exceedingQuota label for components", "size", len(components))

		for _, comp := range components {
			if err := r.tryReScheduleExceedingQuotaComponent(comp.DeepCopy()); err != nil {
				return ctrl.Result{}, err
			}
		}

		logger.Info("finish remove exceedingQuota label for components")
	} else {
		logger.Info("see exceeding quota, will stop components to reduce resource usage", "res", surplusResource)

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

func (r *TenantReconciler) findComponentsToSchedule(tenant string, surplusResource v1alpha1.ResourceList) ([]v1alpha1.Component, error) {
	r.Log.Info("findComponentsToSchedule", "tenant", tenant, "surplusRes", surplusResource)

	var compList v1alpha1.ComponentList
	err := r.List(r.ctx, &compList, client.MatchingLabels{
		v1alpha1.TenantNameLabelKey:         tenant,
		v1alpha1.KalmLabelKeyExceedingQuota: "true",
	})
	if err != nil {
		return nil, err
	}

	// re-schedule higher priority first
	components := compList.Items
	sort.Slice(components, func(i, j int) bool {
		return components[i].Spec.Priority > components[j].Spec.Priority
	})

	r.Log.Info("potential components to schedule", "size", len(components))

	// find components that resource sum won't exceed quota
	var compToReschedule []v1alpha1.Component

	var rescheduleSum v1alpha1.ResourceList
	for _, comp := range compList.Items {
		compResToSchedule := v1alpha1.EstimateResourceConsumption(comp)
		rescheduleSum = v1alpha1.SumResourceList(rescheduleSum, compResToSchedule)

		if exist, _ := v1alpha1.ExistGreaterResourceInList(rescheduleSum, surplusResource); exist {
			return compToReschedule, nil
		}

		compToReschedule = append(compToReschedule, comp)
		r.Log.Info("components to schedule", "curSize", len(compToReschedule))
	}

	return compToReschedule, nil
}

func (r *TenantReconciler) findComponentsToStop(tenant string, surplusResource v1alpha1.ResourceList) ([]v1alpha1.Component, error) {
	var compList v1alpha1.ComponentList
	if err := r.List(r.ctx, &compList, client.MatchingLabels{v1alpha1.TenantNameLabelKey: tenant}); err != nil {
		return nil, err
	}

	// filter
	var components []v1alpha1.Component
	for _, comp := range compList.Items {
		if comp.Labels != nil &&
			comp.Labels[v1alpha1.KalmLabelKeyExceedingQuota] == "true" {
			continue
		}

		components = append(components, comp)
	}

	// sort, stop low priority component first
	sort.Slice(components, func(i, j int) bool {
		return components[i].Spec.Priority < components[j].Spec.Priority
	})

	var componentsToBeStopped []v1alpha1.Component
	for _, comp := range components {
		componentsToBeStopped = append(componentsToBeStopped, comp)

		resListToBeFreed := v1alpha1.EstimateResourceConsumption(comp)
		r.Log.Info("before sum", "surplusResource", surplusResource, "resListToBeFreed", resListToBeFreed)
		surplusResource = v1alpha1.SumResourceList(surplusResource, resListToBeFreed)
		r.Log.Info("stop 1 component", "surplusResource", surplusResource, "comp to be stopped", comp)

		if !v1alpha1.ExistNegativeResource(surplusResource) {
			// all >= 0, tenant quota can be healthy again
			r.Log.Info("stop early of components to stop:", "size", len(componentsToBeStopped))
			return componentsToBeStopped, nil
		}
	}

	return componentsToBeStopped, nil
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

func (r *TenantReconciler) reconcileDnsRecord(tenant *v1alpha1.Tenant) {
	var dnsRecordList v1alpha1.DnsRecordList

	r.List(r.ctx, &dnsRecordList)
	hasDnsRecord := false
	for _, dnsRecord := range dnsRecordList.Items {
		if dnsRecord.Spec.TenantName == tenant.Name {
			hasDnsRecord = true
			break
		}
	}

	if hasDnsRecord == false {
		dnsRecord := v1alpha1.DnsRecord{
			ObjectMeta: ctrl.ObjectMeta{
				Name: fmt.Sprintf("%s-dns-a-record", tenant.Name),
				Labels: map[string]string{
					"tenant": tenant.Name,
				},
			},
			Spec: v1alpha1.DnsRecordSpec{
				TenantName: tenant.Name,
				Type:       "A",
				Name:       generateTentantDomain(),
				Content:    getContent(),
			},
		}

		r.Client.Create(r.ctx, &dnsRecord)

		// TODO create
	}
}

// TODO
func generateTentantDomain() string {
	return fmt.Sprintf("")
}

func getContent() string {
	return ""
}
