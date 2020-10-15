package v1alpha1

import (
	"context"
	"fmt"

	"k8s.io/apimachinery/pkg/api/resource"
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

func updateTenantResource(tenantName string, resourceName ResourceName, changes resource.Quantity) error {
	var tenant Tenant

	if err := webhookClient.Get(context.Background(), types.NamespacedName{
		Name: tenantName,
	}, &tenant); err != nil {
		return err
	}

	limit := tenant.Spec.ResourceQuota[resourceName]
	used := tenant.Status.UsedResourceQuota[resourceName]
	used.Add(changes)

	// used + increment >= limit
	if used.AsDec().Cmp(limit.AsDec()) >= 0 {
		return NewInsufficientResourceError(&tenant, resourceName, changes)
	}

	tenantCopy := tenant.DeepCopy()
	tenantCopy.Status.UsedResourceQuota[resourceName] = used

	return webhookClient.Status().Patch(context.Background(), tenantCopy, client.MergeFrom(&tenant))
}

func AllocateTenantResource(tenantName string, resourceName ResourceName, increment resource.Quantity) error {
	return updateTenantResource(tenantName, resourceName, increment)
}

func ReleaseTenantResource(tenantName string, resourceName ResourceName, decrement resource.Quantity) error {
	decrement.Neg()
	return updateTenantResource(tenantName, resourceName, decrement)
}

func AdjustTenantResource(tenantName string, resourceName ResourceName, old resource.Quantity, new resource.Quantity) error {
	new.Sub(old)
	return updateTenantResource(tenantName, resourceName, new)
}
