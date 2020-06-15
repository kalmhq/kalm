package handler

import (
	"github.com/kapp-staging/kapp/controller/controllers"
	"github.com/labstack/echo/v4"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
)

type PV struct {
	Name               string `json:"name"`
	IsAvailable        bool   `json:"isAvailable"`                  // can be reused or not
	IsInUse            bool   `json:"isInUse"`                      // can be reused or not
	ComponentNamespace string `json:"componentNamespace,omitempty"` // ns of latest component using this PV
	ComponentName      string `json:"componentName,omitempty"`      // name of latest component using this PV
	Phase              string `json:"phase"`                        // Available, Bound, Released
	Capacity           string `json:"capacity"`                     // size, e.g. 1Gi
}

func (h *ApiHandler) handleListVolumes(c echo.Context) error {
	builder := h.Builder(c)

	var pvList v1.PersistentVolumeList
	if err := builder.List(&pvList); err != nil {
		if !errors.IsNotFound(err) {
			return err
		}
	}

	var kappPVList []v1.PersistentVolume
	for _, pv := range pvList.Items {
		if _, exist := pv.Labels[controllers.KappLabelPV]; !exist {
			continue
		}

		kappPVList = append(kappPVList, pv)
	}

	respPVs := []PV{}
	for _, kappPV := range kappPVList {
		var isAvailable bool
		if kappPV.Status.Phase == v1.VolumeAvailable {
			isAvailable = true
		}

		var capInStr string
		if cap, exist := kappPV.Spec.Capacity[v1.ResourceStorage]; exist {
			capInStr = cap.String()
		}

		var compName, compNamespace string
		if v, exist := kappPV.Labels[controllers.KappLabelComponent]; exist {
			compName = v
		}
		if v, exist := kappPV.Labels[controllers.KappLabelNamespace]; exist {
			compNamespace = v
		}

		respPVs = append(respPVs, PV{
			Name:               kappPV.Name,
			ComponentName:      compName,
			ComponentNamespace: compNamespace,
			IsAvailable:        isAvailable,
			IsInUse:            !isAvailable,
			Phase:              string(kappPV.Status.Phase),
			Capacity:           capInStr,
		})
	}

	return c.JSON(200, respPVs)
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
