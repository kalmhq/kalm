package resources

import (
	"fmt"
	"k8s.io/apimachinery/pkg/api/resource"
	"regexp"
	"sort"
	"strings"

	"github.com/kalmhq/kalm/controller/controllers"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	//v1 "k8s.io/apiserver/pkg/apis/example/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// actual aggregation info of PVC & PV
type Volume struct {
	Name               string `json:"name"`
	IsInUse            bool   `json:"isInUse"`                      // can be reused or not
	ComponentNamespace string `json:"componentNamespace,omitempty"` // ns of latest component using this Volume
	ComponentName      string `json:"componentName,omitempty"`      // name of latest component using this Volume
	StorageClassName   string `json:"storageClassName"`
	Capacity           string `json:"capacity"` // size, e.g. 1Gi
	RequestCapacity    string `json:"requestedCapacity"`
	AllocatedCapacity  string `json:"allocatedCapacity,omitempty"`
	PVC                string `json:"pvc"`
	PV                 string `json:"pvToMatch"`
}

func (builder *Builder) BuildVolumeResponse(pvc coreV1.PersistentVolumeClaim, pv coreV1.PersistentVolume) (*Volume, error) {
	isInUse, err := builder.IsPVCInUse(pvc)
	if err != nil {
		return nil, err
	}

	var requestedCapInStr string
	if cap, exist := pvc.Spec.Resources.Requests[coreV1.ResourceStorage]; exist {
		requestedCapInStr = tryFormatQuantity(cap)
	}

	var allocatedCapInStr string
	if storage := pvc.Status.Capacity.Storage(); storage != nil {
		allocatedCapInStr = tryFormatQuantity(*storage)
	}

	var compName, compNamespace string
	if v, exist := pv.Labels[controllers.KalmLabelComponentKey]; exist {
		compName = v
	}
	if v, exist := pv.Labels[controllers.KalmLabelNamespaceKey]; exist {
		compNamespace = v
	}

	return &Volume{
		Name:               pvc.Name,
		ComponentName:      compName,
		ComponentNamespace: compNamespace,
		IsInUse:            isInUse,
		Capacity:           requestedCapInStr,
		RequestCapacity:    requestedCapInStr,
		AllocatedCapacity:  allocatedCapInStr,
	}, nil
}

func tryFormatQuantity(quantity resource.Quantity) string {
	rst := quantity.String()

	if strings.HasSuffix(rst, "m") {
		oneG := int64(1000000000)
		oneM := int64(1000000)

		if quantity.Value()/oneG > 0 {
			rst = fmt.Sprintf("%.1fG", float64(quantity.Value())/float64(oneG))
		} else if quantity.Value()/oneM > 0 {
			rst = fmt.Sprintf("%.1fM", float64(quantity.Value())/float64(oneM))
		}
	}

	return rst
}

func (builder *Builder) GetPVs() ([]coreV1.PersistentVolume, error) {
	var pvList coreV1.PersistentVolumeList

	err := builder.List(&pvList)

	return pvList.Items, err
}

func (builder *Builder) GetPVCs(opts ...client.ListOption) ([]coreV1.PersistentVolumeClaim, error) {
	var pvcList coreV1.PersistentVolumeClaimList

	err := builder.List(&pvcList, opts...)

	return pvcList.Items, err
}

type volPair struct {
	pv  coreV1.PersistentVolume
	pvc coreV1.PersistentVolumeClaim
}

// 1. list all kalm pvcs
// 2. filter all available kalmPVCs
// 3. separate into 2 groups: same-ns pvc & diff-ns pvc (pv reclaimType must be Retain)
// 4. resp: same-ns pvc: pvcName, diff-ns pvc: pvName
func (builder *Builder) FindAvailableVolsForSimpleWorkload(ns string) ([]Volume, error) {
	pvList, err := builder.GetPVs()
	if err != nil {
		return nil, err
	}

	pvcList, err := builder.GetPVCs()
	if err != nil {
		return nil, err
	}

	var unboundPVs []coreV1.PersistentVolume
	var boundedPVs []coreV1.PersistentVolume
	for _, pv := range pvList {
		if pv.Spec.ClaimRef == nil {
			unboundPVs = append(unboundPVs, pv)
			continue
		}

		// make sure bounded pvc still exists
		if _, exist := findPVCByClaimRef(pv.Spec.ClaimRef, pvcList); !exist {
			unboundPVs = append(unboundPVs, pv)
		} else {
			boundedPVs = append(boundedPVs, pv)
		}
	}

	var freePairs []volPair
	var curNsInUsePairs []volPair

	// find if boundedPV's pvc is in use
	for _, boundedPV := range boundedPVs {
		pvc, _ := findPVCByClaimRef(boundedPV.Spec.ClaimRef, pvcList)
		isInUse, err := builder.IsPVCInUse(pvc)
		if err != nil {
			return nil, err
		}

		if isInUse {
			if pvc.Namespace == ns {
				curNsInUsePairs = append(curNsInUsePairs, volPair{
					pv:  boundedPV,
					pvc: pvc,
				})
			}

			continue
		}

		freePairs = append(freePairs, volPair{
			pv:  boundedPV,
			pvc: pvc,
		})
	}

	sameNsFreePairs, diffNsFreePairs := divideAccordingToNs(freePairs, ns)

	rst := []Volume{}
	for _, sameNsFreePair := range sameNsFreePairs {
		pvc := sameNsFreePair.pvc
		pv := sameNsFreePair.pv

		compName, compNs := GetNameAndNsOfPVOwnerComponent(pv)

		// re-use pvc
		rst = append(rst, Volume{
			Name:               pvc.Name,
			IsInUse:            false,
			ComponentNamespace: compNs,
			ComponentName:      compName,
			StorageClassName:   getValOfString(pvc.Spec.StorageClassName),
			Capacity:           GetCapacityOfPVC(pvc),
			PVC:                sameNsFreePair.pvc.Name,
			PV:                 "",
		})
	}

	// re-use pv
	for _, diffNsFreePair := range diffNsFreePairs {
		pvc := diffNsFreePair.pvc
		pv := diffNsFreePair.pv

		compName, compNs := GetNameAndNsOfPVOwnerComponent(pv)

		// re-use pvc
		rst = append(rst, Volume{
			Name:               pvc.Name,
			IsInUse:            false,
			ComponentNamespace: compNs,
			ComponentName:      compName,
			StorageClassName:   getValOfString(pvc.Spec.StorageClassName),
			Capacity:           GetCapacityOfPVC(pvc),
			PVC:                "",
			PV:                 pv.Name,
		})
	}

	for _, unboundPV := range unboundPVs {
		compName, compNs := GetNameAndNsOfPVOwnerComponent(unboundPV)

		// re-use pvc
		rst = append(rst, Volume{
			Name:               unboundPV.Name,
			IsInUse:            false,
			ComponentNamespace: compNs,
			ComponentName:      compName,
			StorageClassName:   unboundPV.Spec.StorageClassName,
			Capacity:           GetCapacityOfPV(unboundPV),
			PVC:                "",
			PV:                 unboundPV.Name,
		})
	}

	// for frontend convenient, also append curNs in use PVC in response
	for _, curNsInUsePair := range curNsInUsePairs {
		pv := curNsInUsePair.pv
		pvc := curNsInUsePair.pvc

		compNs, compName := GetComponentNameAndNs(&pvc)

		rst = append(rst, Volume{
			Name:               pvc.Name,
			IsInUse:            true,
			ComponentNamespace: compNs,
			ComponentName:      compName,
			StorageClassName:   getValOfString(pvc.Spec.StorageClassName),
			Capacity:           GetCapacityOfPV(pv),
			PVC:                pvc.Name,
			PV:                 "",
		})
	}

	return rst, nil
}

func (builder *Builder) FindAvailableVolsForSts(ns string) ([]Volume, error) {
	pvcList, err := builder.GetPVCs(client.InNamespace(ns), client.MatchingLabels{controllers.KalmLabelManaged: "true"})
	if client.IgnoreNotFound(err) != nil {
		return nil, err
	}

	pvcNamePrefix2PVCsMap := make(map[string][]coreV1.PersistentVolumeClaim)
	pvcNamePrefixHasInUsePVC := make(map[string]interface{})

	//format of pvc generated from volClaimTemplate is: <volClaimTplName>-<stsName>-{0,1,2}
	for _, pvc := range pvcList {
		componentName, _ := GetComponentNameAndNs(&pvc)
		if componentName == "" {
			continue
		}

		stsPVCPattern := `^*.-[0-9]+$`
		stsPVCRegex := regexp.MustCompile(stsPVCPattern)

		if match := stsPVCRegex.Match([]byte(pvc.Name)); !match {
			continue
		}

		idx := strings.LastIndex(pvc.Name, "-")
		if idx == -1 {
			continue
		}

		pvcNamePrefix := pvc.Name[:idx]

		isInUse, err := builder.IsPVCInUse(pvc)
		if err != nil {
			return nil, err
		}

		if isInUse {
			pvcNamePrefixHasInUsePVC[pvcNamePrefix] = true
		}

		pvcNamePrefix2PVCsMap[pvcNamePrefix] = append(pvcNamePrefix2PVCsMap[pvcNamePrefix], pvc)
	}

	// rm volClaimTmpl if any pvc belonging to it is in use
	//for volClaimTpl := range pvcNamePrefixHasInUsePVC {
	//	delete(pvcNamePrefix2PVCsMap, volClaimTpl)
	//}

	rst := []Volume{}
	for pvcNamePrefix, pvcs := range pvcNamePrefix2PVCsMap {
		pvc := pvcs[0]
		capacity := GetCapacityOfPVC(pvc)
		compName, compNs := GetComponentNameAndNs(&pvc)

		isInUse := false
		if pvcNamePrefixHasInUsePVC[pvcNamePrefix] == true {
			isInUse = true
		}

		idx := strings.LastIndex(pvcNamePrefix, "-"+compName)
		if idx == -1 {
			continue
		}

		volClaimTplName := pvcNamePrefix[:idx]

		rst = append(rst, Volume{
			Name:               volClaimTplName,
			IsInUse:            isInUse,
			ComponentName:      compName,
			ComponentNamespace: compNs,
			StorageClassName:   getValOfString(pvc.Spec.StorageClassName),
			Capacity:           capacity,
			PVC:                volClaimTplName,
			PV:                 "",
		})
	}

	sort.Slice(rst, func(i, j int) bool {
		// free vol comes first
		if rst[i].IsInUse != rst[j].IsInUse {
			if !rst[i].IsInUse {
				return true
			} else {
				return false
			}
		}

		return false
	})
	return rst, nil
}

func getValOfString(s *string, fallbackOpt ...string) string {
	if s == nil {
		if len(fallbackOpt) == 0 {
			return ""
		}

		return fallbackOpt[0]
	}

	return *s
}

func GetCapacityOfPVC(pvc coreV1.PersistentVolumeClaim) string {
	var capInStr string
	if cap, exist := pvc.Spec.Resources.Requests[coreV1.ResourceStorage]; exist {
		capInStr = cap.String()
	}
	return capInStr
}

func GetCapacityOfPV(pv coreV1.PersistentVolume) string {
	var capInStr string
	if cap, exist := pv.Spec.Capacity[coreV1.ResourceStorage]; exist {
		capInStr = cap.String()
	}
	return capInStr
}

func GetNameAndNsOfPVOwnerComponent(pv coreV1.PersistentVolume) (compName, compNamespace string) {
	if v, exist := pv.Labels[controllers.KalmLabelComponentKey]; exist {
		compName = v
	}
	if v, exist := pv.Labels[controllers.KalmLabelNamespaceKey]; exist {
		compNamespace = v
	}

	return
}

func GetComponentNameAndNs(metaObj metav1.Object) (compName, compNamespace string) {
	if v, exist := metaObj.GetLabels()[controllers.KalmLabelComponentKey]; exist {
		compName = v
	}
	if v, exist := metaObj.GetLabels()[controllers.KalmLabelNamespaceKey]; exist {
		compNamespace = v
	}

	return
}

func divideAccordingToNs(pairs []volPair, ns string) (sameNs []volPair, diffNs []volPair) {
	for _, p := range pairs {
		if p.pvc.Namespace == ns {
			sameNs = append(sameNs, p)
		} else {
			diffNs = append(diffNs, p)
		}
	}

	return
}

func findPVCByClaimRef(
	ref *coreV1.ObjectReference,
	list []coreV1.PersistentVolumeClaim,
) (rst coreV1.PersistentVolumeClaim, exist bool) {
	if ref == nil {
		return
	}

	for _, pvc := range list {
		if pvc.Name == ref.Name && pvc.Namespace == ref.Namespace {
			return pvc, true
		}
	}

	return
}

func (builder *Builder) IsPVCInUse(pvc coreV1.PersistentVolumeClaim) (bool, error) {

	var podList coreV1.PodList
	err := builder.List(&podList, client.InNamespace(pvc.Namespace))
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
