package handler

import (
	"fmt"
	"regexp"
	"sort"
	"strings"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/kalmhq/kalm/controller/controllers"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	kalmclient "github.com/kalmhq/kalm/api/client"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// actually list pvc-pv pairs
// if pvc is not used by any pod, it can be deleted
//
// Permission:
//   nsView, nsEditor and nsOwner can see same ns PVCs
//   clusterViewer and above can see all PVCs
func (h *ApiHandler) handleListVolumes(c echo.Context) error {

	var kalmPVCList v1.PersistentVolumeClaimList
	if err := h.resourceManager.List(&kalmPVCList, client.MatchingLabels{"kalm-managed": "true"}); err != nil {
		if !errors.IsNotFound(err) {
			return err
		}
	}

	//var kalmPVList v1.PersistentVolumeList
	//if err := h.resourceManager.List(&kalmPVList, client.MatchingLabels{"kalm-managed": "true"}); err != nil {
	//	if !errors.IsNotFound(err) {
	//		return err
	//	}
	//}
	//
	//kalmPVMap := make(map[string]v1.PersistentVolume)
	//for _, kalmPV := range kalmPVList.Items {
	//	kalmPVMap[kalmPV.Name] = kalmPV
	//}

	currentUser := getCurrentUser(c)

	respVolumes := []resources.Volume{}
	for _, kalmPVC := range kalmPVCList.Items {
		// permission
		if !h.clientManager.CanViewNamespace(currentUser, kalmPVC.Namespace) {
			continue
		}

		respVolume, err := h.resourceManager.BuildVolumeResponse(kalmPVC)
		if err != nil {
			return err
		}

		respVolumes = append(respVolumes, *respVolume)
	}

	sort.Slice(respVolumes, func(i, j int) bool {
		a := respVolumes[i]
		b := respVolumes[j]

		if a.IsInUse == b.IsInUse {
			return strings.Compare(a.Name, b.Name) < 0
		} else if a.IsInUse {
			return true
		} else {
			return false
		}
	})

	return c.JSON(200, respVolumes)
}

func (h *ApiHandler) handleDeletePVC(c echo.Context) error {
	currentUser := getCurrentUser(c)

	pvcNamespace := c.Param("namespace")
	pvcName := c.Param("name")

	// MARK: diff with doc https://docs.kalm.dev/next/auth/roles (delete disk(pv))
	// nsEditor should be able to delete same ns pvc & pv
	if !h.clientManager.CanEditNamespace(currentUser, pvcNamespace) {
		return resources.NoNamespaceEditorRoleError(pvcNamespace)
	}

	var pvc v1.PersistentVolumeClaim
	if err := h.resourceManager.Get(pvcNamespace, pvcName, &pvc); err != nil {
		return err
	}

	if isInUse, err := h.resourceManager.IsPVCInUse(pvc); err != nil {
		return err
	} else if isInUse {
		return fmt.Errorf("cannot delete PVC in use")
	}

	var pvList v1.PersistentVolumeList
	if err := h.resourceManager.List(&pvList); err != nil {
		return err
	}

	var underlyingPV *v1.PersistentVolume
	for i := 0; i < len(pvList.Items); i++ {
		pv := pvList.Items[i]
		pvClaimRef := pv.Spec.ClaimRef

		if pvClaimRef == nil {
			continue
		}

		if pvClaimRef.Namespace != pvcNamespace ||
			pvClaimRef.Name != pvcName {
			continue
		}

		underlyingPV = &pv
		break
	}

	if underlyingPV != nil {
		copy := underlyingPV.DeepCopy()
		if copy.Labels == nil {
			copy.Labels = make(map[string]string)
		}

		// instead of delete, mark pv with label
		// clean will be triggered once pvc is deleted
		copy.Labels[controllers.KalmLabelCleanIfPVCGone] = fmt.Sprintf("%s-%s", pvc.Namespace, pvc.Name)

		if err := h.resourceManager.Update(copy); err != nil {
			return err
		}
	}

	if err := h.resourceManager.Delete(&pvc); err != nil {
		return err
	}

	return c.NoContent(200)
}

func (h *ApiHandler) handleAvailableVolsForSimpleWorkload(c echo.Context) error {
	currentUser := getCurrentUser(c)
	ns := c.Param("namespace")

	if ns == "" {
		ns = c.QueryParam("currentNamespace")
	}

	if ns == "" {
		return fmt.Errorf("must provide namespace in query")
	}

	h.MustCanView(currentUser, ns, "*")

	vols, err := h.findAvailableVolsForSimpleWorkload(getCurrentUser(c), ns)
	if err != nil {
		return err
	}

	return c.JSON(200, vols)
}

func (h *ApiHandler) handleAvailableVolsForSts(c echo.Context) error {
	currentUser := getCurrentUser(c)

	ns := c.Param("namespace")
	if ns == "" {
		return fmt.Errorf("must provide namespace in query")
	}

	h.MustCanView(currentUser, ns, "*")

	vols, err := h.findAvailableVolsForSts(ns)
	if err != nil {
		return err
	}

	return c.JSON(200, vols)
}

// 1. list all kalm pvcs
// 2. filter all available kalmPVCs
// 3. separate into 2 groups: same-ns pvc & diff-ns pvc (pv reclaimType must be Retain)
// 4. resp: same-ns pvc: pvcName, diff-ns pvc: pvName
func (h *ApiHandler) findAvailableVolsForSimpleWorkload(c *kalmclient.ClientInfo, ns string) ([]resources.Volume, error) {
	pvList, err := h.resourceManager.GetPVs()
	if err != nil {
		return nil, err
	}

	pvcList, err := h.resourceManager.GetPVCs()
	if err != nil {
		return nil, err
	}

	//var unboundPVs []v1.PersistentVolume
	var boundedPVs []v1.PersistentVolume
	for _, pv := range pvList {
		if pv.Spec.ClaimRef == nil {
			//unboundPVs = append(unboundPVs, pv)
			continue
		}

		// make sure bounded pvc still exists
		if _, exist := resources.FindBoundingPVCFromList(pv, pvcList); !exist {
			continue
			//unboundPVs = append(unboundPVs, pv)
		}

		boundedPVs = append(boundedPVs, pv)
	}

	var freePairs []volPair
	var curNsInUsePairs []volPair

	// find if boundedPV's pvc is in use
	for _, boundedPV := range boundedPVs {
		pvc, _ := resources.FindBoundingPVCFromList(boundedPV, pvcList)
		isInUse, err := h.resourceManager.IsPVCInUse(pvc)
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

	rst := []resources.Volume{}
	for _, sameNsFreePair := range sameNsFreePairs {
		pvc := sameNsFreePair.pvc
		compName, compNs := GetComponentNameAndNsFromObjLabels(&pvc)

		// re-use pvc
		rst = append(rst, resources.Volume{
			Name:               pvc.Name,
			IsInUse:            false,
			ComponentNamespace: compNs,
			ComponentName:      compName,
			StorageClassName:   getValOfString(pvc.Spec.StorageClassName),
			Capacity:           getCapacityOfPVC(pvc),
			PVC:                sameNsFreePair.pvc.Name,
			PV:                 "",
		})
	}

	// re-use pv
	for _, diffNsFreePair := range diffNsFreePairs {
		pvc := diffNsFreePair.pvc
		pv := diffNsFreePair.pv

		// permission: if no edit permission in this ns, skip
		if !h.clientManager.CanEditNamespace(c, pvc.Namespace) {
			continue
		}

		compName, compNs := GetComponentNameAndNsFromObjLabels(&pvc)

		// re-use pvc
		rst = append(rst, resources.Volume{
			Name:               pvc.Name,
			IsInUse:            false,
			ComponentNamespace: compNs,
			ComponentName:      compName,
			StorageClassName:   getValOfString(pvc.Spec.StorageClassName),
			Capacity:           getCapacityOfPVC(pvc),
			PVC:                "",
			PV:                 pv.Name,
		})
	}

	//for _, unboundPV := range unboundPVs {
	//	compName, compNs := GetComponentNameAndNsFromObjLabels(&unboundPV)
	//
	//	// re-use pvc
	//	rst = append(rst, resources.Volume{
	//		Name:               unboundPV.Name,
	//		IsInUse:            false,
	//		ComponentNamespace: compNs,
	//		ComponentName:      compName,
	//		StorageClassName:   unboundPV.Spec.StorageClassName,
	//		Capacity:           GetCapacityOfPV(unboundPV),
	//		PVC:                "",
	//		PV:                 unboundPV.Name,
	//	})
	//}

	// for frontend convenient, also append curNs in use PVC in response
	for _, curNsInUsePair := range curNsInUsePairs {
		pvc := curNsInUsePair.pvc

		compNs, compName := GetComponentNameAndNsFromObjLabels(&pvc)

		rst = append(rst, resources.Volume{
			Name:               pvc.Name,
			IsInUse:            true,
			ComponentNamespace: compNs,
			ComponentName:      compName,
			StorageClassName:   getValOfString(pvc.Spec.StorageClassName),
			Capacity:           getCapacityOfPVC(pvc),
			PVC:                pvc.Name,
			PV:                 "",
		})
	}

	return rst, nil
}

type volPair struct {
	pv  v1.PersistentVolume
	pvc v1.PersistentVolumeClaim
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

func getCapacityOfPVC(pvc v1.PersistentVolumeClaim) resource.Quantity {
	var capInQuantity resource.Quantity
	if cap, exist := pvc.Spec.Resources.Requests[v1.ResourceStorage]; exist {
		capInQuantity = cap
	}
	return capInQuantity
}

func (h *ApiHandler) findAvailableVolsForSts(ns string) ([]resources.Volume, error) {
	pvcList, err := h.resourceManager.GetPVCs(
		client.InNamespace(ns),
		client.MatchingLabels{controllers.KalmLabelManaged: "true"},
	)

	if client.IgnoreNotFound(err) != nil {
		return nil, err
	}

	pvcNamePrefix2PVCsMap := make(map[string][]v1.PersistentVolumeClaim)
	pvcNamePrefixHasInUsePVC := make(map[string]interface{})

	//format of pvc generated from volClaimTemplate is: <volClaimTplName>-<stsName>-{0,1,2}
	for i := range pvcList {
		pvc := pvcList[i]

		componentName, _ := GetComponentNameAndNsFromObjLabels(&pvc)
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

		isInUse, err := h.resourceManager.IsPVCInUse(pvc)
		if err != nil {
			return nil, err
		}

		if isInUse {
			pvcNamePrefixHasInUsePVC[pvcNamePrefix] = true
		}

		pvcNamePrefix2PVCsMap[pvcNamePrefix] = append(pvcNamePrefix2PVCsMap[pvcNamePrefix], pvc)
	}

	rst := []resources.Volume{}
	for pvcNamePrefix, pvcs := range pvcNamePrefix2PVCsMap {
		pvc := pvcs[0]
		capacity := getCapacityOfPVC(pvc)
		compName, compNs := GetComponentNameAndNsFromObjLabels(&pvc)

		isInUse := false
		if pvcNamePrefixHasInUsePVC[pvcNamePrefix] == true {
			isInUse = true
		}

		idx := strings.LastIndex(pvcNamePrefix, "-"+compName)
		if idx == -1 {
			continue
		}

		volClaimTplName := pvcNamePrefix[:idx]

		rst = append(rst, resources.Volume{
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
			return !rst[i].IsInUse
		}

		return false
	})
	return rst, nil
}

func GetComponentNameAndNsFromObjLabels(metaObj metav1.Object) (compName, compNamespace string) {
	compName = metaObj.GetLabels()[v1alpha1.KalmLabelComponentKey]
	compNamespace = metaObj.GetLabels()[v1alpha1.KalmLabelNamespaceKey]

	return
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
