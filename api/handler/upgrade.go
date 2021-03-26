package handler

import (
	"fmt"
	"net/http"

	installv1alpha1 "github.com/kalmhq/kalm/operator/api/v1alpha1"
	"github.com/labstack/echo/v4"
)

type VersionResponse struct {
	Version           string `json:"version,omitempty"`
	ControllerVersion string `json:"controllerVersion,omitempty"`
	DashboardVersion  string `json:"dashboardVersion,omitempty"`
}

type UpgradeVersionRequest struct {
	Version           string `json:"version,omitempty"`
	ControllerVersion string `json:"controllerVersion,omitempty"`
	DashboardVersion  string `json:"dashboardVersion,omitempty"`
}

func (h *ApiHandler) handleCurrentVersion(c echo.Context) error {
	opConfig, err := h.getKalmOperatorConfig()
	if err != nil {
		h.logger.Info(fmt.Sprintf("fail to getKalmOperatorConfig, err: %s", err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	var dashboardVersion, controllerVersion string
	if opConfig.Spec.Dashboard != nil {
		dashboardVersion = *opConfig.Spec.Dashboard.Version
	}
	if opConfig.Spec.Controller != nil {
		controllerVersion = *opConfig.Spec.Controller.Version
	}

	return c.JSON(200, VersionResponse{
		Version:           opConfig.Spec.Version,
		DashboardVersion:  dashboardVersion,
		ControllerVersion: controllerVersion,
	})
}

func (h *ApiHandler) getKalmOperatorConfig() (*installv1alpha1.KalmOperatorConfig, error) {
	kalmOperatorConfigList := installv1alpha1.KalmOperatorConfigList{}

	if err := h.resourceManager.List(&kalmOperatorConfigList); err != nil {
		return nil, err
	}

	size := len(kalmOperatorConfigList.Items)
	if size == 0 {
		return nil, fmt.Errorf("no KalmOperatorConfig exists")
	} else if size > 1 {
		return nil, fmt.Errorf("more than one KalmOperatorConfig exist")
	}

	opConfig := kalmOperatorConfigList.Items[0]
	return opConfig.DeepCopy(), nil
}

func (h *ApiHandler) handleUpgradeVersion(c echo.Context) error {
	//only clusterOwner can call this
	currentUser := getCurrentUser(c)
	if !h.clientManager.CanManageCluster(currentUser) {
		return fmt.Errorf("permission denied to update cluster")
	}

	upgradeRequest := UpgradeVersionRequest{}
	if err := c.Bind(&upgradeRequest); err != nil {
		return err
	}

	version, dashboardVersion, controllerVersion := getVersionInfo(upgradeRequest)

	opConfig, err := h.getKalmOperatorConfig()
	if err != nil {
		h.logger.Info(fmt.Sprintf("fail to getKalmOperatorConfig, err: %s", err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
	}

	if version != "" {
		opConfig.Spec.Version = version
	}

	if dashboardVersion != "" {
		if opConfig.Spec.Dashboard == nil {
			opConfig.Spec.Dashboard = &installv1alpha1.DashboardConfig{}
		}

		opConfig.Spec.Dashboard.Version = &dashboardVersion
	}

	if controllerVersion != "" {
		if opConfig.Spec.Controller == nil {
			opConfig.Spec.Controller = &installv1alpha1.ControllerConfig{}
		}

		opConfig.Spec.Controller.Version = &controllerVersion
	}

	if err := h.resourceManager.Update(opConfig); err != nil {
		return err
	}

	return c.JSON(http.StatusOK, nil)
}

func getVersionInfo(updateRequest UpgradeVersionRequest) (version, dashboardVersion, controllerVersion string) {

	version = updateRequest.Version

	if updateRequest.DashboardVersion != "" {
		dashboardVersion = updateRequest.DashboardVersion
	} else {
		dashboardVersion = version
	}

	if updateRequest.ControllerVersion != "" {
		controllerVersion = updateRequest.ControllerVersion
	} else {
		controllerVersion = version
	}

	return
}
