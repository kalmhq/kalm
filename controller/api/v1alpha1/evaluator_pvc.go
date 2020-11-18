package v1alpha1

import (
	"context"
	"fmt"

	admissionv1beta1 "k8s.io/api/admission/v1beta1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	"sigs.k8s.io/controller-runtime/pkg/client"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
)

var pvcEvaluatorLog = logf.Log.WithName("pvc-evaluator")

type pvcEvaluator struct {
}

var _ TenantEvaluator = &pvcEvaluator{}

func (e pvcEvaluator) Usage(reqInfo AdmissionRequestInfo) (ResourceList, error) {

	pvc, ok := reqInfo.Obj.(*corev1.PersistentVolumeClaim)
	if !ok {
		return nil, fmt.Errorf("reqInfo.obj is not pvc")
	}

	tenantName, err := GetTenantNameFromObj(reqInfo.Obj)
	if err != nil {
		return nil, err
	} else if tenantName == "" {
		return nil, NoTenantFoundError
	}

	var tenantPVCList corev1.PersistentVolumeClaimList
	if err := webhookClient.List(context.Background(), &tenantPVCList, client.MatchingLabels{
		TenantNameLabelKey: tenantName,
	}); err != nil {
		return nil, err
	}

	sumList := getPVCsToSum(*pvc, tenantPVCList.Items, reqInfo.Operation)

	var size resource.Quantity
	for _, pvc := range sumList {
		storage := pvc.Spec.Resources.Requests.Storage()
		if storage == nil {
			pvcEvaluatorLog.Info("see pvc without storage, ignored", "pvc", getKey(&pvc))
			continue
		}

		size.Add(*storage)
	}

	return ResourceList{ResourceStorage: size}, nil
}

func getPVCsToSum(curPVC corev1.PersistentVolumeClaim, list []corev1.PersistentVolumeClaim, op admissionv1beta1.Operation) (rst []corev1.PersistentVolumeClaim) {

	pvcMap := make(map[string]corev1.PersistentVolumeClaim)

	curKey := getKey(&curPVC)
	pvcMap[curKey] = curPVC

	for _, item := range list {
		pvcMap[getKey(&item)] = item
	}

	isDeleteOp := op == admissionv1beta1.Delete

	for key, item := range pvcMap {
		if item.DeletionTimestamp != nil {
			continue
		}

		if isDeleteOp && key == curKey {
			continue
		}

		rst = append(rst, item)
	}

	return rst
}
