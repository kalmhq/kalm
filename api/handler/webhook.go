package handler

import (
	"fmt"
	"github.com/kalmhq/kalm/api/auth"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/kalmhq/kalm/controller/controllers"
	"github.com/labstack/echo/v4"
	"net/http"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"strconv"
	"strings"
	"time"
)

type DeployWebhookCallParams struct {
	DeployKey     string `json:"deployKey"`
	Namespace     string `json:"application"`
	ComponentName string `json:"componentName"`
	ImageTag      string `json:"imageTag"`
}

func (h *ApiHandler) handleDeployWebhookCall(c echo.Context) error {
	var callParams DeployWebhookCallParams

	if err := c.Bind(&callParams); err != nil {
		return err
	}

	bearerToken := auth.ExtractTokenFromHeader(c.Request().Header.Get(echo.HeaderAuthorization))

	if bearerToken != "" {
		callParams.DeployKey = bearerToken
	}

	if callParams.DeployKey == "" {
		return fmt.Errorf("deployKey can't be blank")
	}

	if callParams.Namespace == "" {
		return fmt.Errorf("application can't be blank")
	}

	if callParams.ComponentName == "" {
		return fmt.Errorf("componentName can't be blank")
	}

	clientInfo, err := h.clientManager.GetClientInfoFromToken(callParams.DeployKey)

	if err != nil {
		return err
	}

	builder := resources.NewBuilder(clientInfo, h.logger, h.rbacEnforcer)

	if builder == nil {
		return fmt.Errorf("invalid access token")
	}

	if !builder.CanEdit(callParams.Namespace, "components/"+callParams.ComponentName) {
		return resources.NoObjectEditorRoleError(callParams.Namespace, "components/"+callParams.ComponentName)
	}

	crdComp, err := builder.GetComponent(callParams.Namespace, callParams.ComponentName)

	if err != nil {
		return err
	}

	copiedComp := crdComp.DeepCopy()

	if callParams.ImageTag != "" {
		newImg := replaceImageTag(crdComp.Spec.Image, callParams.ImageTag)
		copiedComp.Spec.Image = newImg
	}

	if copiedComp.Annotations == nil {
		copiedComp.Annotations = make(map[string]string)
	}

	updateTs := int(time.Now().Unix())
	copiedComp.Annotations[controllers.AnnoLastUpdatedByWebhook] = strconv.Itoa(updateTs)

	if err := builder.Patch(copiedComp, client.MergeFrom(crdComp)); err != nil {
		h.logger.Info("fail updating component", "name", copiedComp.Name, "time", updateTs)
		return err
	}

	h.logger.Info("updating component", "name", copiedComp.Name, "time", updateTs)

	var accessToken v1alpha1.AccessToken
	if err := builder.Get("", clientInfo.Name, &accessToken); err == nil {
		copiedKey := accessToken.DeepCopy()
		copiedKey.Status.UsedCount += 1
		copiedKey.Status.LastUsedAt = updateTs

		if err := builder.Patch(copiedKey, client.MergeFrom(&accessToken)); err != nil {
			h.logger.Error(err, "fail update status of access token")
		}
	} else {
		h.logger.Error(err, "fail to get access token")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"status": "Success",
	})
}

// controller/foo,    v1 -> controller/foo:v1
// controller/foo:v2, v3 -> controller/foo:v3
func replaceImageTag(image string, tag string) string {
	sepIdx := strings.LastIndex(image, ":")
	if sepIdx == -1 {
		return image + ":" + tag
	}

	parts := strings.Split(image, ":")
	parts[len(parts)-1] = tag

	return strings.Join(parts, ":")
}
