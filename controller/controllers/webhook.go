package controllers

import (
	"context"
	"fmt"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
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
	ResourceName v1alpha1.ResourceName
	Tenant       *v1alpha1.Tenant
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

func NewInsufficientResourceError(tenant *v1alpha1.Tenant, resourceName v1alpha1.ResourceName, increment resource.Quantity) error {
	return &InsufficientResourceError{
		ResourceName: resourceName,
		Tenant:       tenant,
		Increment:    &increment,
	}
}

func AllocateTenantResource(tenantName string, resourceName v1alpha1.ResourceName, increment resource.Quantity) error {
	var tenant v1alpha1.Tenant

	if err := webhookClient.Get(context.Background(), types.NamespacedName{
		Name: tenantName,
	}, &tenant); err != nil {
		return err
	}

	limit := tenant.Spec.ResourceQuota[resourceName]
	used := tenant.Status.UsedResourceQuota[resourceName]
	used.Add(increment)

	// used + increment >= limit
	if used.AsDec().Cmp(limit.AsDec()) >= 0 {
		return NewInsufficientResourceError(&tenant, resourceName, increment)
	}

	tenantCopy := tenant.DeepCopy()
	tenantCopy.Status.UsedResourceQuota[resourceName] = used

	return webhookClient.Status().Patch(context.Background(), tenantCopy, client.MergeFrom(&tenant))
}
