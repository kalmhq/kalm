package v1alpha1

import (
	"fmt"
	"reflect"

	admissionv1beta1 "k8s.io/api/admission/v1beta1"
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

	//todo use schema info instead of hard code
	nsGK := schema.GroupKind{Group: "", Kind: "Namespace"}
	evaluators[nsGK] = nsEvaluator{}

	httpsCertGK := schema.GroupKind{Group: GroupVersion.Group, Kind: "HttpsCert"}
	evaluators[httpsCertGK] = httpsCertEvaluator{}

	podGK := schema.GroupKind{Group: "", Kind: "Pod"}
	evaluators[podGK] = podEvaluator{}

	pvcGK := schema.GroupKind{Group: "", Kind: "PersistentVolumeClaim"}
	evaluators[pvcGK] = pvcEvaluator{}

	svcGK := schema.GroupKind{Group: "", Kind: "Service"}
	evaluators[svcGK] = svcEvaluator{}

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

	//todo more evaluator

	evaluatorRegistry.evaluators = evaluators
}

func GetTenantEvaluator(gr schema.GroupKind) (TenantEvaluator, bool) {
	v, exist := evaluatorRegistry.evaluators[gr]
	fmt.Println("<<<<<<", gr, v, exist)
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
		return tenant, nil
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
		return fmt.Errorf("fail the tenant check, err: %s", err)
	}

	if noResourceChanged(newTenant, *tenant) {
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

func noResourceChanged(a, b Tenant) bool {
	//todo
	return false
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

func tryReCountAndUpdateResourceForTenant(tenantName string, resName ResourceName, currentObj runtime.Object, objList []runtime.Object, isDelete bool) error {

	cnt := reCountResource(currentObj, objList, isDelete)

	cntQuantity := resource.NewQuantity(int64(cnt), resource.DecimalSI)
	fmt.Println("cntQuantity", cntQuantity, "resName", resName, "tenant", tenantName)
	if err := SetTenantResourceByName(tenantName, resName, *cntQuantity); err != nil {
		return err
	}

	return nil
}

func getKey(obj runtime.Object) string {
	objMeta, err := meta.Accessor(obj)
	if err != nil {
		//todo, return err?
		return ""
	}

	key := fmt.Sprintf("%s/%s", objMeta.GetNamespace(), objMeta.GetName())
	return key
}
func getKey2(obj interface{}) string {
	objMeta, err := meta.Accessor(obj)
	if err == nil {
		key := fmt.Sprintf("%s/%s", objMeta.GetNamespace(), objMeta.GetName())
		return key
	}

	// reflect
	bType := reflect.TypeOf(obj)
	_, has1 := bType.FieldByName("Name")
	_, has2 := bType.FieldByName("Namespace")
	//fmt.Println("FFFFFFFFFFFF:", has1, has2, bType, getNameMeth, getNSMeth)

	if has1 && has2 {
		val := reflect.ValueOf(&obj).Elem().Elem()

		name := val.FieldByName("Name")
		ns := val.FieldByName("Namespace")

		rst := fmt.Sprintf("%s/%s", ns, name)
		return rst
	}

	return ""
}
