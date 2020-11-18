package v1alpha1

import (
	"context"
	"fmt"

	admissionv1beta1 "k8s.io/api/admission/v1beta1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

var _ TenantEvaluator = nsEvaluator{}

type nsEvaluator struct {
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

	isDelete := reqInfo.Operation == admissionv1beta1.Delete
	cnt := reCountResource(reqInfo.Obj, nsListToObjList(nsList.Items), isDelete)
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
