package v1alpha1

import (
	"context"
	"fmt"

	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

var webhookClient client.Client
var webhookReader client.Reader

func InitializeWebhookClient(mgr ctrl.Manager) {
	webhookClient = mgr.GetClient()
	webhookReader = mgr.GetAPIReader()
}

type InsufficientResourceError struct {
	ResourceName ResourceName
	Tenant       *Tenant
	Increment    *resource.Quantity
}

func (e *InsufficientResourceError) Error() string {
	limit := e.Tenant.Spec.ResourceQuota[e.ResourceName]
	used := e.Tenant.Spec.ResourceQuota[e.ResourceName]

	lp := &limit
	up := &used

	return fmt.Sprintf(
		"Insufficient %s in %s tenant. Limit: %s, Used: %s, Requesting: %s.",
		e.ResourceName,
		e.Tenant.Name,
		lp.String(),
		up.String(),
		e.Increment.String(),
	)
}

func NewInsufficientResourceError(tenant *Tenant, resourceName ResourceName, increment resource.Quantity) error {
	return &InsufficientResourceError{
		ResourceName: resourceName,
		Tenant:       tenant,
		Increment:    &increment,
	}
}

// concurrent update safe?
// v1.18 server side apply
func updateTenantResource(tenant *Tenant, resourceName ResourceName, changes resource.Quantity) error {
	limit := tenant.Spec.ResourceQuota[resourceName]
	used := tenant.Status.UsedResourceQuota[resourceName]
	used.Add(changes)

	// used + increment >= limit
	if used.AsDec().Cmp(limit.AsDec()) >= 0 {
		return NewInsufficientResourceError(tenant, resourceName, changes)
	}

	tenantCopy := tenant.DeepCopy()
	tenantCopy.Status.UsedResourceQuota[resourceName] = used

	return webhookClient.Status().Patch(context.Background(), tenantCopy, client.MergeFrom(tenant))
}

func AllocateTenantResource(obj runtime.Object, resourceName ResourceName, increment resource.Quantity) error {
	tenant, err := getTenantNameFromObj(obj)

	if err != nil {
		return err
	}

	return updateTenantResource(tenant, resourceName, increment)
}

func ReleaseTenantResource(obj runtime.Object, resourceName ResourceName, decrement resource.Quantity) error {
	tenant, err := getTenantNameFromObj(obj)

	if err != nil {
		return err
	}

	decrement.Neg()

	return updateTenantResource(tenant, resourceName, decrement)
}

func AdjustTenantResource(obj runtime.Object, resourceName ResourceName, old resource.Quantity, new resource.Quantity) error {
	tenant, err := getTenantNameFromObj(obj)

	if err != nil {
		return err
	}

	new.Sub(old)

	return updateTenantResource(tenant, resourceName, new)
}

func getTenantNameFromObj(obj runtime.Object) (*Tenant, error) {
	objMeta, err := meta.Accessor(obj)

	if err != nil {
		return nil, err
	}

	labels := objMeta.GetLabels()

	if labels == nil {
		return nil, fmt.Errorf("No labels in obj %+v", obj)
	}

	tenantName := labels[TenantNameLabelKey]

	if tenantName == "" {
		return nil, fmt.Errorf("No tenant name found in obj %+v", obj)
	}

	objectKey := types.NamespacedName{
		Name: tenantName,
	}

	var tenant Tenant

	if err := webhookClient.Get(context.Background(), objectKey, &tenant); err != nil {
		return nil, err
	}

	return &tenant, nil
}
