package handler

import (
	"github.com/kapp-staging/kapp/controller/controllers"
	"github.com/labstack/echo/v4"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
)

type PV struct {
	Name        string
	IsAvailable bool
	Phase       string
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
		if _, exist := pv.Labels[controllers.KappPVLabelName]; !exist {
			continue
		}

		kappPVList = append(kappPVList, pv)
	}

	var respPVs []PV
	for _, kappPV := range kappPVList {
		var isAvailable bool
		if kappPV.Status.Phase == v1.VolumeAvailable {
			isAvailable = true
		}

		respPVs = append(respPVs, PV{
			Name:        kappPV.Name,
			IsAvailable: isAvailable,
			Phase:       string(kappPV.Status.Phase),
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
