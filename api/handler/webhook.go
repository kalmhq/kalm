package handler

import (
	"encoding/json"
	"fmt"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/kalmhq/kalm/controller/controllers"
	"github.com/labstack/echo/v4"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd/api"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func (h *ApiHandler) handleDeployWebhookCall(c echo.Context) error {
	deployKeyToken := c.QueryParam("deploy-key")
	ns := c.QueryParam("app")
	componentName := c.QueryParam("component")
	imgTag := c.QueryParam("image-tag")

	if existEmpty(deployKeyToken, ns, componentName, imgTag) {
		return c.NoContent(http.StatusBadRequest)
	}

	deployKeyConfig, err := h.clientManager.GetClientConfigWithAuthInfo(
		&api.AuthInfo{Token: deployKeyToken},
	)
	if err != nil {
		return err
	}

	deployKeyClient, err := kubernetes.NewForConfig(deployKeyConfig)
	if err != nil {
		return err
	}

	builder := resources.NewBuilder(deployKeyClient, deployKeyConfig, h.logger)
	crdComp, err := builder.GetComponent(ns, componentName)
	if err != nil {
		return err
	}

	// replace Image with given tag
	newImg := replaceImageTag(crdComp.Spec.Image, imgTag)
	copy := crdComp.DeepCopy()
	copy.Spec.Image = newImg

	if copy.Annotations == nil {
		copy.Annotations = make(map[string]string)
	}
	copy.Annotations[controllers.AnnoLastUpdatedByWebhook] = strconv.Itoa(int(time.Now().Unix()))

	bts, _ := json.Marshal(copy)
	var component v1alpha1.Component

	compAbsPath := fmt.Sprintf("/apis/core.kalm.dev/v1alpha1/namespaces/%s/components/%s", ns, componentName)
	err = deployKeyClient.RESTClient().Put().Body(bts).AbsPath(compAbsPath).Do(c.Request().Context()).Into(&component)
	if err != nil {
		return err
	}

	return c.NoContent(http.StatusOK)
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

func existEmpty(strs ...string) bool {
	for _, str := range strs {
		if str == "" {
			return true
		}
	}

	return false
}
