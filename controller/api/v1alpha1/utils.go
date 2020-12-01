package v1alpha1

import (
	"fmt"
	"strconv"

	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
)

var utillog = logf.Log.WithName("v1alpha1-utils")

func EstimateResourceConsumption(component Component, considerOriginalReplicasForExceedingQuota ...bool) ResourceList {

	// component must have spec.ResourceRequirements.Limits
	if component.Spec.ResourceRequirements == nil ||
		component.Spec.ResourceRequirements.Limits == nil {

		utillog.Error(fmt.Errorf("see component without spec.resourceRequirements.limits"), "component webhook should guarantee this")
		return nil
	}

	resList := make(ResourceList)

	var replicas int
	if component.Spec.Replicas == nil {
		replicas = 1
	} else {
		replicas = int(*component.Spec.Replicas)
	}

	considerOriginReplicas := len(considerOriginalReplicasForExceedingQuota) > 0 && considerOriginalReplicasForExceedingQuota[0]
	isExceedingQuota := component.Labels[KalmLabelKeyExceedingQuota] == "true"

	if considerOriginReplicas && isExceedingQuota {
		originalReplicas, err := strconv.ParseInt(component.Labels[KalmLabelKeyOriginalReplicas], 10, 64)
		if err == nil {
			replicas = int(originalReplicas)
		}
	}

	// pods resource consumption
	for resName, quantity := range component.Spec.ResourceRequirements.Limits {
		switch resName {
		case v1.ResourceCPU:
			incResource(resList, ResourceCPU, multiQuantity(quantity, replicas))
		case v1.ResourceMemory:
			incResource(resList, ResourceMemory, multiQuantity(quantity, replicas))
		default:
			utillog.Info("see Resource in component not handled", "resource", resName)
		}
	}

	// storage, disk & memory
	for _, vol := range component.Spec.Volumes {
		switch vol.Type {
		case VolumeTypePersistentVolumeClaim:

			if vol.PVToMatch != "" {
				// trying to re-use disk, ignored
				continue
			}

			incResource(resList, ResourceStorage, multiQuantity(vol.Size, replicas))

		case VolumeTypePersistentVolumeClaimTemplate:

			//todo re-use case not handled
			incResource(resList, ResourceStorage, multiQuantity(vol.Size, replicas))

		case VolumeTypeTemporaryMemory:

			incResource(resList, ResourceMemory, multiQuantity(vol.Size, replicas))

		case VolumeTypeTemporaryDisk:

			utillog.Info("see using tmpDisk, should be disabled for SaaS version")

		case VolumeTypeHostPath:

			utillog.Info("see using hostPath, should be disabled for SaaS version")

		}
	}

	// istio sidecar resource consumption
	for resName, quantity := range component.Spec.IstioResourceRequirements.Limits {
		switch resName {
		case v1.ResourceCPU:
			incResource(resList, ResourceCPU, multiQuantity(quantity, replicas))
		case v1.ResourceMemory:
			incResource(resList, ResourceMemory, multiQuantity(quantity, replicas))
		case v1.ResourceEphemeralStorage:
			incResource(resList, ResourceEphemeralStorage, multiQuantity(quantity, replicas))
		default:
			utillog.Info("see Resource in component not handled", "resource", resName)
		}
	}

	return resList
}

func incResource(resList ResourceList, resName ResourceName, deltaQuantity resource.Quantity) {
	newQuantity := resList[resName]
	newQuantity.Add(deltaQuantity)

	resList[resName] = newQuantity
}

//todo
func multiQuantity(quantity resource.Quantity, cnt int) resource.Quantity {
	var rst resource.Quantity
	for i := 0; i < cnt; i++ {
		rst.Add(quantity)
	}

	return rst
}

func GetSurplusResource(tenant Tenant) (rst ResourceList, noNegative bool) {
	rst = make(ResourceList)
	noNegative = true

	for resName, quantity := range tenant.Spec.ResourceQuota {
		if usedQuantity, exist := tenant.Status.UsedResourceQuota[resName]; exist {
			quantity.Sub(usedQuantity)
		}

		rst[resName] = quantity

		zero := resource.Quantity{}
		if quantity.Cmp(zero) < 0 {
			noNegative = false
		}
	}

	return rst, noNegative
}

func SumResourceList(resLists ...ResourceList) ResourceList {
	rst := make(ResourceList)

	for _, resList := range resLists {
		for resName, quantity := range resList {
			existQuantity := rst[resName]
			existQuantity.Add(quantity)

			rst[resName] = existQuantity
		}
	}

	return rst
}

// result = to - from
func GetDeltaOfResourceList(from, to ResourceList, noNegativeOpt ...bool) ResourceList {
	rst := make(ResourceList)

	keys := make(map[ResourceName]interface{})
	for k := range from {
		keys[k] = nil
	}
	for k := range to {
		keys[k] = nil
	}

	for k := range keys {
		fromQuantity := from[k]
		toQuantity := to[k]

		toQuantity.Sub(fromQuantity)

		zero := resource.NewQuantity(0, resource.DecimalSI)
		if toQuantity.Cmp(*zero) < 0 && len(noNegativeOpt) > 0 && noNegativeOpt[0] {
			toQuantity = *zero
		}

		rst[k] = toQuantity
	}

	return rst
}

type ExceedingResourceInfo struct {
	ResourceName ResourceName
	Base         resource.Quantity
	Target       resource.Quantity
}

func (i ExceedingResourceInfo) String() string {
	return fmt.Sprintf("Resource: %s, Base: %s, Target: %s", i.ResourceName, i.Base.String(), i.Target.String())
}

// existGreaterResource in resList than baseResList
func ExistGreaterResourceInList(resList, baseResList ResourceList) (bool, []ExceedingResourceInfo) {
	var exceedingInfoList []ExceedingResourceInfo

	for resName, quantity := range resList {
		baseQuantity := baseResList[resName]

		if quantity.Cmp(baseQuantity) > 0 {
			exceedingInfoList = append(exceedingInfoList, ExceedingResourceInfo{
				ResourceName: resName,
				Base:         baseQuantity,
				Target:       quantity,
			})
		}
	}

	return len(exceedingInfoList) > 0, exceedingInfoList
}

func ExistNegativeResource(resList ResourceList) bool {
	for _, quantity := range resList {
		if quantity.Cmp(resource.Quantity{}) < 0 {
			return true
		}
	}

	return false
}

func IsNamespaceKalmEnabled(namespace v1.Namespace) bool {
	if v, exist := namespace.Labels[KalmEnableLabelName]; !exist || v != KalmEnableLabelValue {
		return false
	}

	return true
}
