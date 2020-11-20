package v1alpha1

import (
	"context"
	"fmt"

	admissionv1beta1 "k8s.io/api/admission/v1beta1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type svcEvaluator struct {
}

var _ TenantEvaluator = &svcEvaluator{}

func (e svcEvaluator) Usage(reqInfo AdmissionRequestInfo) (ResourceList, error) {
	svc, ok := reqInfo.Obj.(*corev1.Service)
	if !ok {
		return nil, fmt.Errorf("obj not corev1.Service")
	}

	tenantName, err := GetTenantNameFromObj(svc)
	if err != nil {
		return nil, err
	} else if tenantName == "" {
		return nil, NoTenantFoundError
	}

	var svcList corev1.ServiceList
	if err := webhookClient.List(context.Background(), &svcList, client.MatchingLabels{TenantNameLabelKey: tenantName}); err != nil {
		return nil, err
	}

	svcListToSum := getSvcListToSum(*svc, svcList.Items, reqInfo.Operation)

	quantity := resource.NewQuantity(int64(len(svcListToSum)), resource.DecimalSI)

	return ResourceList{ResourceServicesCount: *quantity}, nil
}

func getSvcListToSum(svc corev1.Service, svcList []corev1.Service, op admissionv1beta1.Operation) (rst []corev1.Service) {

	m := make(map[string]corev1.Service)

	curKey := getKey(&svc)
	m[curKey] = svc

	for _, item := range svcList {
		m[getKey(&item)] = item
	}

	isDeleteOP := op == admissionv1beta1.Delete

	for key, item := range m {
		if item.DeletionTimestamp != nil {
			continue
		}

		if isDeleteOP && key == curKey {
			continue
		}

		rst = append(rst, item)
	}

	return rst
}
