package v1alpha1

import (
	"fmt"
	"reflect"

	admissionv1beta1 "k8s.io/api/admission/v1beta1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"

	logf "sigs.k8s.io/controller-runtime/pkg/log"
)

var tenantLog = logf.Log.WithName("tenant")

var evaluatorRegistry tenantEvaluatorRegistry

type tenantEvaluatorRegistry struct {
	evaluators map[schema.GroupKind]TenantEvaluator
}

func initEvaluatorRegistry() {
	evaluatorRegistry = tenantEvaluatorRegistry{}

	evaluators := make(map[schema.GroupKind]TenantEvaluator)

	// dedicated evaluators

	podGK := schema.GroupKind{Group: "", Kind: "Pod"}
	evaluators[podGK] = podEvaluator{}

	pvcGK := schema.GroupKind{Group: "", Kind: "PersistentVolumeClaim"}
	evaluators[pvcGK] = pvcEvaluator{}

	// native Resource using CntEvaluator

	nsGK := schema.GroupKind{Group: "", Kind: "Namespace"}
	evaluators[nsGK] = cntEvaluator{
		ListType:     reflect.TypeOf(corev1.NamespaceList{}),
		ResourceName: ResourceApplicationsCount,
	}

	svcGK := schema.GroupKind{Group: "", Kind: "Service"}
	evaluators[svcGK] = cntEvaluator{
		ListType:     reflect.TypeOf(corev1.ServiceList{}),
		ResourceName: ResourceServicesCount,
	}

	// CRD using CntEvaluator

	httpsCertGK := schema.GroupKind{Group: GroupVersion.Group, Kind: "HttpsCert"}
	evaluators[httpsCertGK] = cntEvaluator{
		ListType:     reflect.TypeOf(HttpsCertList{}),
		ResourceName: ResourceHttpsCertsCount,
	}

	accessTokenGK := schema.GroupKind{Group: GroupVersion.Group, Kind: "AccessToken"}
	evaluators[accessTokenGK] = cntEvaluator{
		ListType:     reflect.TypeOf(AccessTokenList{}),
		ResourceName: ResourceAccessTokensCount,
	}

	dockerRegGK := schema.GroupKind{Group: GroupVersion.Group, Kind: "DockerRegistry"}
	evaluators[dockerRegGK] = cntEvaluator{
		ListType:     reflect.TypeOf(DockerRegistryList{}),
		ResourceName: ResourceDockerRegistriesCount,
	}

	httpRouteRegGK := schema.GroupKind{Group: GroupVersion.Group, Kind: "HttpRoute"}
	evaluators[httpRouteRegGK] = cntEvaluator{
		ListType:     reflect.TypeOf(HttpRouteList{}),
		ResourceName: ResourceHttpRoutesCount,
	}

	componentGK := schema.GroupKind{Group: GroupVersion.Group, Kind: "Component"}
	evaluators[componentGK] = cntEvaluator{
		ListType:     reflect.TypeOf(ComponentList{}),
		ResourceName: ResourceComponentsCount,
	}

	roleBindingGK := schema.GroupKind{Group: GroupVersion.Group, Kind: "RoleBinding"}
	evaluators[roleBindingGK] = cntEvaluator{
		ListType:     reflect.TypeOf(RoleBindingList{}),
		ResourceName: ResourceRoleBindingCount,
	}

	evaluatorRegistry.evaluators = evaluators
}

func GetTenantEvaluator(gr schema.GroupKind) (TenantEvaluator, bool) {
	v, exist := evaluatorRegistry.evaluators[gr]
	tenantLog.Info("GetTenantEvaluator", "gr", gr, "evalutator", v, "exist", exist)
	return v, exist
}

//+kubebuilder:object:generate=false
type TenantEvaluator interface {
	Usage(req AdmissionRequestInfo) (ResourceList, error)
}

//+kubebuilder:object:generate=false
type AdmissionRequestInfo struct {
	// Req       admission.Request
	Operation admissionv1beta1.Operation
	Obj       runtime.Object
	IsDryRun  bool
}

func NewAdmissionRequestInfo(obj runtime.Object, op admissionv1beta1.Operation, isDryRun bool) AdmissionRequestInfo {
	return AdmissionRequestInfo{
		Obj:       obj,
		Operation: op,
		IsDryRun:  isDryRun,
	}
}

// if ok, return tenant to be updated,
// if not, return error
func checkAdmissionRequestAgainstTenant(tenant Tenant, reqInfo AdmissionRequestInfo) (Tenant, error) {
	gk := reqInfo.Obj.GetObjectKind().GroupVersionKind().GroupKind()
	evaluator, exist := GetTenantEvaluator(gk)
	if !exist {
		return tenant, EvaluatorNotExistError
	}

	resourceList, err := evaluator.Usage(reqInfo)
	if err != nil {
		return tenant, err
	}
	tenantLog.Info("usage", "new", resourceList, "old", tenant.Status.UsedResourceQuota)

	tenantCopy := tenant.DeepCopy()
	for resName, quantity := range resourceList {
		limit := tenant.Spec.ResourceQuota[resName]

		if quantity.Cmp(limit) > 0 {
			return tenant, ExceedingQuotaError
		}
	}

	if tenantCopy.Status.UsedResourceQuota == nil {
		tenantCopy.Status.UsedResourceQuota = make(ResourceList)
	}

	for resName, quantity := range resourceList {
		tenantCopy.Status.UsedResourceQuota[resName] = quantity
	}

	return *tenantCopy, nil
}

// check tenant resource, if req can be applied, update resource consumption
func CheckAndUpdateTenant(tenantName string, reqInfo AdmissionRequestInfo, remainingRetries int) error {
	if tenantName == "" {
		return fmt.Errorf("invalid tenantName, should not be empty")
	}

	if remainingRetries < 0 {
		return fmt.Errorf("running out of retries")
	}

	tenant, err := GetTenantByName(tenantName)
	if err != nil {
		return err
	}

	newTenant, err := checkAdmissionRequestAgainstTenant(*tenant, reqInfo)
	tenantLog.Info("checkAdmissionRequestAgainstTenant", "newTenant", newTenant, "err", err)

	if err != nil {
		return err
	}

	if isResourceUsageExactlySame(newTenant, *tenant) {
		return nil
	}

	// skip update for dry-run
	if reqInfo.IsDryRun {
		return nil
	}

	if err := UpdateTenantStatus(newTenant); err != nil {
		// for resource version conflict, retry
		return CheckAndUpdateTenant(tenantName, reqInfo, remainingRetries-1)
	}

	return nil
}

// check if resource usage of the two tenant is exactly the same
func isResourceUsageExactlySame(a, b Tenant) bool {
	resourceNames := make(map[ResourceName]interface{})

	for resName := range a.Status.UsedResourceQuota {
		resourceNames[resName] = true
	}
	for resName := range b.Status.UsedResourceQuota {
		resourceNames[resName] = true
	}

	for resName := range resourceNames {
		aQuantity := a.Status.UsedResourceQuota[resName]
		bQuantity := b.Status.UsedResourceQuota[resName]

		if aQuantity.Cmp(bQuantity) != 0 {
			return false
		}
	}

	return true
}

func reCountResource(currentObj runtime.Object, objList []runtime.Object, isDelete bool) int {

	resMap := make(map[string]runtime.Object)

	resMap[getKey(currentObj)] = currentObj
	for _, obj := range objList {
		resMap[getKey(obj)] = obj
	}

	var cnt int
	for _, cur := range resMap {
		// ignore resource being deleted
		objMeta, err := meta.Accessor(cur)
		if err == nil && objMeta.GetDeletionTimestamp() != nil {
			continue
		}

		if getKey(cur) == getKey(currentObj) {
			// if deleting current resource, ignore in count
			if isDelete {
				continue
			}
		}

		cnt++
	}

	return cnt
}

func getKey(obj runtime.Object) string {
	objMeta, err := meta.Accessor(obj)
	if err != nil {
		return ""
	}

	key := fmt.Sprintf("%s/%s", objMeta.GetNamespace(), objMeta.GetName())
	return key
}

// will try to get Name and Namespace info from obj
// return false if no such info exist
func tryGetResourceKey(obj interface{}) (string, bool) {
	if objMeta, err := meta.Accessor(obj); err == nil {
		key := fmt.Sprintf("%s/%s", objMeta.GetNamespace(), objMeta.GetName())
		return key, true
	}

	// otherwise, try get field: Name & Namespace using reflect
	bType := reflect.TypeOf(obj)
	_, hasName := bType.FieldByName("Name")
	_, hasNamespace := bType.FieldByName("Namespace")

	if hasName && hasNamespace {
		val := reflect.ValueOf(&obj).Elem().Elem()

		name := val.FieldByName("Name")
		ns := val.FieldByName("Namespace")

		rst := fmt.Sprintf("%s/%s", ns, name)
		return rst, true
	}

	tenantLog.Info("fail to get key of obj:", obj)
	return "", false
}

func FillMissingResourceAsZero(res ResourceList) ResourceList {
	rst := make(ResourceList)
	for _, resName := range ResourceNameList {
		rst[resName] = *resource.NewQuantity(0, resource.DecimalSI)
	}

	for resName, quantity := range res {
		rst[resName] = quantity
	}

	return rst
}
