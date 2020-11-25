package v1alpha1

import (
	"context"
	"fmt"

	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/tools/record"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

var webhookClient client.Client
var webhookReader client.Reader
var eventRecorder record.EventRecorder

func InitializeWebhookClient(mgr ctrl.Manager) {
	webhookClient = mgr.GetClient()
	webhookReader = mgr.GetAPIReader()
	eventRecorder = mgr.GetEventRecorderFor("kalm-webhook")

	//todo better place for init this registry?
	initEvaluatorRegistry()
}

type InsufficientResourceError struct {
	ResourceName ResourceName
	Tenant       *Tenant
	Increment    *resource.Quantity
}

func (e *InsufficientResourceError) Error() string {
	limit := e.Tenant.Spec.ResourceQuota[e.ResourceName]
	used := e.Tenant.Status.UsedResourceQuota[e.ResourceName]

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

var NoTenantFoundError error = fmt.Errorf("No Tenant Error")              // Tenant resource not exist
var NoTenantLabelSetError error = fmt.Errorf("No Tenant Label Set Error") // tenant label is not set in Object
var TenantChangedError error = fmt.Errorf("Tenant can't not be changed")

func IsNoTenantFoundError(err error) bool {
	return err == NoTenantFoundError
}

func IgnoreNoTenantFoundError(err error) error {
	if IsNoTenantFoundError(err) {
		return nil
	}

	return err
}

func NewInsufficientResourceError(tenant *Tenant, resourceName ResourceName, increment resource.Quantity) error {
	return &InsufficientResourceError{
		ResourceName: resourceName,
		Tenant:       tenant,
		Increment:    &increment,
	}
}

func UpdateTenantStatus(tenant Tenant) error {
	return webhookClient.Status().Update(context.Background(), &tenant)
}

func HasTenantSet(obj runtime.Object) bool {
	_, err := GetTenantFromObj(obj)
	return err == nil
}

func IsTenantChanged(new, old runtime.Object) bool {
	newObjectTenantName, _ := GetTenantNameFromObj(new)
	oldObjectTenantName, _ := GetTenantNameFromObj(old)
	return newObjectTenantName != oldObjectTenantName
}

func GetTenantNameFromObj(obj runtime.Object) (string, error) {
	objMeta, err := meta.Accessor(obj)
	if err != nil {
		return "", err
	}

	labels := objMeta.GetLabels()
	if labels == nil {
		return "", NoTenantLabelSetError
	}

	tenantName := labels[TenantNameLabelKey]
	if tenantName == "" {
		return "", NoTenantLabelSetError
	}

	return tenantName, nil
}

func GetTenantFromObj(obj runtime.Object) (*Tenant, error) {
	tenantName, err := GetTenantNameFromObj(obj)
	if err != nil {
		return nil, err
	}

	return GetTenantByName(tenantName)
}

func GetTenantByName(tenantName string) (*Tenant, error) {
	objectKey := types.NamespacedName{
		Name: tenantName,
	}

	var tenant Tenant
	if err := webhookClient.Get(context.Background(), objectKey, &tenant); err != nil {
		if errors.IsNotFound(err) {
			return nil, NoTenantFoundError
		}

		return nil, err
	}

	return &tenant, nil
}

func InheritTenantFromNamespace(obj runtime.Object) error {
	objMeta, err := meta.Accessor(obj)

	if err != nil {
		return err
	}

	namespaceName := objMeta.GetNamespace()

	if namespaceName == "" {
		return fmt.Errorf("can't use InheritTenantFromNamespace for a cluster scope resource")
	}

	labels := objMeta.GetLabels()

	if labels == nil {
		labels = make(map[string]string)
	}

	var namespace v1.Namespace

	if err := webhookClient.Get(context.Background(), types.NamespacedName{Name: namespaceName}, &namespace); err != nil {
		return nil
	}

	namespaceMeta, err := meta.Accessor(&namespace)
	if err != nil {
		return err
	}

	namespaceLabels := namespaceMeta.GetLabels()

	var tenant string

	if namespaceLabels != nil {
		tenant = namespaceLabels[TenantNameLabelKey]
	}

	if tenant == "" {
		//?
		tenant = DefaultGlobalTenantName
	}

	labels[TenantNameLabelKey] = tenant
	objMeta.SetLabels(labels)

	return nil
}

func SetTenantForObj(obj runtime.Object, tenantName string) error {
	objMeta, err := meta.Accessor(obj)

	if err != nil {
		return err
	}

	labels := objMeta.GetLabels()

	if labels == nil {
		labels = make(map[string]string)
	}

	labels[TenantNameLabelKey] = tenantName
	objMeta.SetLabels(labels)

	return nil
}

var sysNamespaceMap = map[string]interface{}{
	"kalm-system":    true,
	"kalm-operator":  true,
	"istio-system":   true,
	"istio-operator": true,
	"cert-manager":   true,
}

func IsKalmSystemNamespace(ns string) bool {
	_, exist := sysNamespaceMap[ns]
	return exist
}
