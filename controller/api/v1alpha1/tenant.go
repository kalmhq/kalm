package v1alpha1

import (
	"context"
	"fmt"

	admissionv1beta1 "k8s.io/api/admission/v1beta1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/webhook/admission"
)

var evaluatorRegistry tenantEvaluatorRegistry

type tenantEvaluatorRegistry struct {
	evaluators map[schema.GroupResource]TenantEvaluator
}

func initEvaluatorRegistry() {
	evaluatorRegistry = tenantEvaluatorRegistry{}

	evaluators := make(map[schema.GroupResource]TenantEvaluator)

	//todo use schema info
	nsGR := schema.GroupResource{Group: "", Resource: "namespaces"}
	evaluators[nsGR] = nsEvaluator{}

	//todo more evaluator

	evaluatorRegistry.evaluators = evaluators
}

type nsEvaluator struct {
}

var _ TenantEvaluator = nsEvaluator{}

//+kubebuilder:object:generate=false
type AdmissionRequestInfo struct {
	Req admission.Request
	Obj runtime.Object
}

func (e nsEvaluator) Usage(reqInfo AdmissionRequestInfo) (ResourceList, error) {
	tenantName, err := GetTenantNameFromObj(reqInfo.Obj)
	if err != nil {
		return nil, NoTenantFoundError
	}

	var nsList corev1.NamespaceList
	if err := webhookClient.List(context.Background(), &nsList, client.MatchingLabels{TenantNameLabelKey: tenantName}); err != nil {
		return nil, err
	}

	isDelete := reqInfo.Req.Operation == admissionv1beta1.Delete
	cnt := tryReCountResourceForTenant(reqInfo.Obj, nsListToObjList(nsList.Items), isDelete)
	fmt.Println(">>>>>>", cnt, len(nsList.Items), isDelete)

	quantity := resource.NewQuantity(int64(cnt), resource.DecimalSI)
	rst := map[ResourceName]resource.Quantity{
		ResourceApplicationsCount: *quantity,
	}

	return rst, nil
}

func nsListToObjList(items []corev1.Namespace) []runtime.Object {
	var rst []runtime.Object
	for i := range items {
		item := items[i]
		rst = append(rst, &item)
	}
	return rst
}

func GetTenantEvaluator(gr schema.GroupResource) (TenantEvaluator, bool) {
	v, exist := evaluatorRegistry.evaluators[gr]
	fmt.Println("<<<<<<", gr, v, exist)
	return v, exist
}

//+kubebuilder:object:generate=false
type TenantEvaluator interface {
	Usage(req AdmissionRequestInfo) (ResourceList, error)
}

// if ok, return tenant to be updated,
// if not, return error
func checkAdmissionRequestAgainstTenant(tenant Tenant, reqInfo AdmissionRequestInfo) (Tenant, error) {
	req := reqInfo.Req

	gr := schema.GroupResource{Group: req.Resource.Group, Resource: req.Resource.Resource}
	evaluator, exist := GetTenantEvaluator(gr)
	if !exist {
		return tenant, nil
	}

	resourceList, err := evaluator.Usage(reqInfo)
	if err != nil {
		return tenant, err
	}

	tenantCopy := tenant.DeepCopy()
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
	if err != nil {
		return fmt.Errorf("fail the tenant check, err: %s", err)
	}

	if noResourceChanged(newTenant, *tenant) {
		return nil
	}

	// skip update for dry-run
	if reqInfo.Req.DryRun != nil && *reqInfo.Req.DryRun {
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
