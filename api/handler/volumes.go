package handler

import (
	"fmt"
	"github.com/kalmhq/kalm/controller/controllers"
	"sort"
	"strings"

	"github.com/kalmhq/kalm/api/resources"
	"github.com/labstack/echo/v4"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// actually list pvc-pv pairs
// if pvc is not used by any pod, it can be deleted
func (h *ApiHandler) handleListVolumes(c echo.Context) error {
	if !h.clientManager.CanViewCluster(getCurrentUser(c)) {
		return resources.NoClusterViewerRoleError
	}

	var kalmPVCList v1.PersistentVolumeClaimList
	if err := h.resourceManager.List(&kalmPVCList, client.MatchingLabels{"kalm-managed": "true"}); err != nil {
		if !errors.IsNotFound(err) {
			return err
		}
	}

	var kalmPVList v1.PersistentVolumeList
	if err := h.resourceManager.List(&kalmPVList, client.MatchingLabels{"kalm-managed": "true"}); err != nil {
		if !errors.IsNotFound(err) {
			return err
		}
	}

	kalmPVMap := make(map[string]v1.PersistentVolume)
	for _, kalmPV := range kalmPVList.Items {
		kalmPVMap[kalmPV.Name] = kalmPV
	}

	respVolumes := []resources.Volume{}
	for _, kalmPVC := range kalmPVCList.Items {
		if !h.clientManager.CanViewNamespace(getCurrentUser(c), kalmPVC.Namespace) {
			continue
		}

		// TODO the second param seems not used.
		respVolume, err := h.resourceManager.BuildVolumeResponse(kalmPVC, kalmPVMap[kalmPVC.Spec.VolumeName])

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
	pvcNamespace := c.Param("namespace")
	pvcName := c.Param("name")

	if !h.clientManager.CanEditNamespace(getCurrentUser(c), pvcNamespace) {
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
	ns := c.Param("namespace")
	if ns == "" {
		ns = c.QueryParam("currentNamespace")
	}

	if ns == "" {
		return fmt.Errorf("must provide namespace in query")
	}

	if !h.clientManager.CanViewNamespace(getCurrentUser(c), ns) {
		return resources.NoNamespaceViewerRoleError(ns)
	}

	vols, err := h.resourceManager.FindAvailableVolsForSimpleWorkload(ns)
	if err != nil {
		return err
	}

	return c.JSON(200, vols)
}

func (h *ApiHandler) handleAvailableVolsForSts(c echo.Context) error {
	ns := c.Param("namespace")
	if ns == "" {
		return fmt.Errorf("must provide namespace in query")
	}

	if !h.clientManager.CanViewNamespace(getCurrentUser(c), ns) {
		return resources.NoNamespaceViewerRoleError(ns)
	}

	vols, err := h.resourceManager.FindAvailableVolsForSts(ns)
	if err != nil {
		return err
	}

	return c.JSON(200, vols)
}
