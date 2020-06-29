package handler

import (
	"fmt"
	"github.com/kapp-staging/kapp/api/resources"
	"github.com/kapp-staging/kapp/controller/controllers"
	"github.com/labstack/echo/v4"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// actually list pvc-pv pairs
// if pvc is not used by any pod, it can be deleted
func (h *ApiHandler) handleListVolumes(c echo.Context) error {
	builder := h.Builder(c)

	var kappPVCList v1.PersistentVolumeClaimList
	if err := builder.List(&kappPVCList, client.MatchingLabels{"kapp-managed": "true"}); err != nil {
		if !errors.IsNotFound(err) {
			return err
		}
	}

	var kappPVList v1.PersistentVolumeList
	if err := builder.List(&kappPVList, client.MatchingLabels{"kapp-managed": "true"}); err != nil {
		if !errors.IsNotFound(err) {
			return err
		}
	}

	kappPVMap := make(map[string]v1.PersistentVolume)
	for _, kappPV := range kappPVList.Items {
		kappPVMap[kappPV.Name] = kappPV
	}

	respVolumes := []resources.Volume{}
	for _, kappPVC := range kappPVCList.Items {

		isInUse, err := builder.IsPVCInUse(kappPVC)
		if err != nil {
			continue
		}

		var capInStr string
		if cap, exist := kappPVC.Spec.Resources.Requests[v1.ResourceStorage]; exist {
			capInStr = cap.String()
		}

		var compName, compNamespace string
		if kappPV, exist := kappPVMap[kappPVC.Spec.VolumeName]; exist {
			if v, exist := kappPV.Labels[controllers.KappLabelComponent]; exist {
				compName = v
			}
			if v, exist := kappPV.Labels[controllers.KappLabelNamespace]; exist {
				compNamespace = v
			}
		}

		respVolumes = append(respVolumes, resources.Volume{
			Name:               kappPVC.Name,
			ComponentName:      compName,
			ComponentNamespace: compNamespace,
			IsInUse:            isInUse,
			Capacity:           capInStr,
		})
	}

	return c.JSON(200, respVolumes)
}

func (h *ApiHandler) handleDeletePVC(c echo.Context) error {
	pvcNamespace := c.Param("namespace")
	pvcName := c.Param("name")

	builder := h.Builder(c)

	var pvc v1.PersistentVolumeClaim
	if err := builder.Get(pvcNamespace, pvcName, &pvc); err != nil {
		return err
	}

	if isInUse, err := builder.IsPVCInUse(pvc); err != nil {
		return err
	} else if isInUse {
		return fmt.Errorf("cannot delete PVC in use")
	}

	var pvList v1.PersistentVolumeList
	if err := builder.List(&pvList); err != nil {
		if errors.IsNotFound(err) {
			return err
		}
	}

	if err := builder.Delete(&pvc); err != nil {
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
		if err := builder.Delete(underlyingPV); err != nil {
			return err
		}
	}

	return c.NoContent(200)
}

func (h *ApiHandler) handleAvailableVolsForSimpleWorkload(c echo.Context) error {
	ns := c.QueryParam("currentNamespace")

	builder := h.Builder(c)
	vols, err := builder.FindAvailableVolsForSimpleWorkload(ns)
	if err != nil {
		return err
	}

	return c.JSON(200, vols)
}

func (h *ApiHandler) handleAvailableVolsForSts(c echo.Context) error {
	ns := c.Param("namespace")

	builder := h.Builder(c)
	vols, err := builder.FindAvailableVolsForSts(ns)
	if err != nil {
		return err
	}

	return c.JSON(200, vols)
}
