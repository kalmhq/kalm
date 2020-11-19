package v1alpha1

import (
	"context"
	"fmt"
	"reflect"

	admissionv1beta1 "k8s.io/api/admission/v1beta1"
	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type cntEvaluator struct {
	ListType     reflect.Type
	ResourceName ResourceName
}

var _ TenantEvaluator = &cntEvaluator{}

func (e cntEvaluator) Usage(reqInfo AdmissionRequestInfo) (ResourceList, error) {

	tenantName, err := GetTenantNameFromObj(reqInfo.Obj)
	if err != nil {
		return nil, err
	} else if tenantName == "" {
		return nil, NoTenantFoundError
	}

	//make list
	list := reflect.New(e.ListType)
	asRuntimeObjList, ok := list.Interface().(runtime.Object)
	if !ok {
		return nil, fmt.Errorf("fail to recover as runtime.object list from reflect")
	}

	if err := webhookClient.List(context.Background(), asRuntimeObjList, client.MatchingLabels{TenantNameLabelKey: tenantName}); err != nil {
		return nil, err
	}

	var items []interface{}

	//elem := reflect.ValueOf(list).Elem()
	elem := list.Elem()
	for i := 0; i < elem.NumField(); i++ {
		varName := elem.Type().Field(i).Name

		if varName != "Items" {
			continue
		}

		varValue := elem.Field(i).Interface()

		s := reflect.ValueOf(varValue)
		for i := 0; i < s.Len(); i++ {
			item := s.Index(i)

			tmp := item.Interface()
			items = append(items, tmp)
		}
	}

	items2Sum := getItems2Sum(reqInfo.Obj, items, reqInfo.Operation)
	quantity := resource.NewQuantity(int64(len(items2Sum)), resource.DecimalSI)

	return ResourceList{e.ResourceName: *quantity}, nil
}

func getItems2Sum(curObj runtime.Object, items []interface{}, op admissionv1beta1.Operation) []interface{} {

	itemMap := make(map[string]interface{})

	curObjKey := getKey(curObj)
	itemMap[curObjKey] = curObj

	for i := range items {
		item := items[i]

		if key, ok := tryGetResourceKey(item); ok {
			itemMap[key] = item
		}
	}

	isDelete := op == admissionv1beta1.Delete

	var rst []interface{}
	for _, item := range itemMap {
		objMeta, err := meta.Accessor(item)
		if err == nil && objMeta.GetDeletionTimestamp() != nil {
			continue
		}

		key, ok := tryGetResourceKey(item)
		if !ok {
			continue
		}

		if key == curObjKey {
			// if deleting current resource, ignore in count
			if isDelete {
				continue
			}
		}

		rst = append(rst, item)
	}

	return rst
}
