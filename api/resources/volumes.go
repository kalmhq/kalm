package resources

import (
	"k8s.io/apimachinery/pkg/api/resource"
	"strconv"

	"github.com/kalmhq/kalm/controller/controllers"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// actual aggregation info of PVC & PV
type Volume struct {
	Name                string            `json:"name"`
	IsInUse             bool              `json:"isInUse"`                      // can be reused or not
	ComponentNamespace  string            `json:"componentNamespace,omitempty"` // ns of latest component using this Volume
	ComponentName       string            `json:"componentName,omitempty"`      // name of latest component using this Volume
	StorageClassName    string            `json:"storageClassName"`
	Capacity            resource.Quantity `json:"capacity"` // size, e.g. 1Gi
	RequestedCapacity   resource.Quantity `json:"requestedCapacity"`
	AllocatedCapacity   resource.Quantity `json:"allocatedCapacity"`
	PVC                 string            `json:"pvc"`
	PV                  string            `json:"pvToMatch"`
	StsVolClaimTemplate string            `json:"stsVolClaimTemplate,omitempty"`
}

func (resourceManager *ResourceManager) BuildVolumeResponse(
	pvc coreV1.PersistentVolumeClaim,
) (*Volume, error) {

	isInUse, err := resourceManager.IsPVCInUse(pvc)
	if err != nil {
		return nil, err
	}

	var capInQuantity resource.Quantity
	if cap, exist := pvc.Spec.Resources.Requests[coreV1.ResourceStorage]; exist {
		capInQuantity = cap
	}

	var allocatedQuantity resource.Quantity
	if storage := pvc.Status.Capacity.Storage(); storage != nil {
		allocatedQuantity = *storage
	}

	compName := pvc.Labels[controllers.KalmLabelComponentKey]

	stsVolClaimTemplate := pvc.Labels[controllers.KalmLabelVolClaimTemplateName]

	return &Volume{
		Name:                pvc.Name,
		ComponentName:       compName,
		ComponentNamespace:  pvc.Namespace,
		IsInUse:             isInUse,
		Capacity:            capInQuantity,
		RequestedCapacity:   capInQuantity,
		AllocatedCapacity:   allocatedQuantity,
		StsVolClaimTemplate: stsVolClaimTemplate,
	}, nil
}

func formatQuantity(quantity resource.Quantity) string {
	capInStr := strconv.FormatInt(quantity.Value(), 10)
	return capInStr
}

func (resourceManager *ResourceManager) GetPVs() ([]coreV1.PersistentVolume, error) {
	var pvList coreV1.PersistentVolumeList

	err := resourceManager.List(&pvList)

	return pvList.Items, err
}

func (resourceManager *ResourceManager) GetPVCs(opts ...client.ListOption) ([]coreV1.PersistentVolumeClaim, error) {
	var pvcList coreV1.PersistentVolumeClaimList

	err := resourceManager.List(&pvcList, opts...)

	return pvcList.Items, err
}

func GetComponentNameAndNsFromObjLabels(metaObj metav1.Object) (compName, compNamespace string) {
	compName = metaObj.GetLabels()[controllers.KalmLabelComponentKey]
	compNamespace = metaObj.GetLabels()[controllers.KalmLabelNamespaceKey]

	return
}

func (resourceManager *ResourceManager) IsPVCInUse(pvc coreV1.PersistentVolumeClaim) (bool, error) {
	var podList coreV1.PodList
	err := resourceManager.List(&podList, client.InNamespace(pvc.Namespace))
	if errors.IsNotFound(err) {
		return false, err
	}

	isInUse := isPVCInUse(pvc, podList.Items)

	return isInUse, nil
}

func isPVCInUse(pvc coreV1.PersistentVolumeClaim, podList []coreV1.Pod) bool {
	isInUse := false
	for _, pod := range podList {
		for _, vol := range pod.Spec.Volumes {
			if vol.PersistentVolumeClaim == nil {
				continue
			}

			if vol.PersistentVolumeClaim.ClaimName == pvc.Name {
				isInUse = true
				break
			}
		}

		if isInUse {
			break
		}
	}

	return isInUse
}
