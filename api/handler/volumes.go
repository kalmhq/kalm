package handler

import (
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

		isInUse, err := isPVCInUsed(builder, kappPVC)
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

func (h *ApiHandler) handleDeletePV(c echo.Context) error {
	pvName := c.Param("name")
	builder := h.Builder(c)

	var pv v1.PersistentVolume
	if err := builder.Get("", pvName, &pv); err != nil {
		return err
	}

	if pv.Status.Phase != v1.VolumeAvailable {
		return c.JSON(409, "PersistentVolume can only be deleted in phase: Available")
	}

	if err := builder.Delete(&pv); err != nil {
		return err
	}

	return c.NoContent(200)
}

func isPVCInUsed(builder *resources.Builder, pvc v1.PersistentVolumeClaim) (bool, error) {
	var podList v1.PodList
	err := builder.List(&podList, client.InNamespace(pvc.Namespace))
	if errors.IsNotFound(err) {
		return false, err
	}

	isInUse := false
	for _, pod := range podList.Items {
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

	return isInUse, nil
}

func (h *ApiHandler) handleAvailableVolsForSimpleWorkload(c echo.Context) error {
	ns := c.Param("ns")

	builder := h.Builder(c)
	vols, err := builder.FindAvailableVolsForSimpleWorkload(ns)
	if err != nil {
		return err
	}

	return c.JSON(200, vols)
}

func (h *ApiHandler) handleAvailableVolsForSts(c echo.Context) error {
	ns := c.Param("ns")
	compName := c.Param("componentName")

	builder := h.Builder(c)
	vols, err := builder.FindAvailableVolsForSts(ns, compName)
	if err != nil {
		return err
	}

	return c.JSON(200, vols)
}
