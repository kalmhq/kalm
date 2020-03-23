package handler

import (
	"encoding/json"
	"github.com/kapp-staging/kapp/api/resources"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
)

// Deprecated
func (h *ApiHandler) handleGetComponentTemplates(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Get().AbsPath("/apis/core.kapp.dev/v1alpha1/componenttemplates").DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

// Deprecated
func (h *ApiHandler) handleCreateComponentTemplate(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Post().Body(c.Request().Body).AbsPath("/apis/core.kapp.dev/v1alpha1/componenttemplates").DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

// Deprecated
func (h *ApiHandler) handleUpdateComponentTemplate(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Put().Body(c.Request().Body).AbsPath("/apis/core.kapp.dev/v1alpha1/componenttemplates/" + c.Param("name")).DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

// Deprecated
func (h *ApiHandler) handleDeleteComponentTemplate(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Delete().AbsPath("/apis/core.kapp.dev/v1alpha1/componenttemplates/" + c.Param("name")).DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleGetComponentTemplatesNew(c echo.Context) error {
	componentTemplateList, err := getKappComponentTemplateList(c)

	if err != nil {
		return err
	}

	return c.JSON(200, h.componentTemplateListResponse(c, componentTemplateList))
}

func (h *ApiHandler) handleCreateComponentTemplateNew(c echo.Context) error {
	componentTemplate, err := createKappComponentTemplate(c)

	if err != nil {
		return err
	}

	return c.JSON(201, h.componentTemplateResponse(c, componentTemplate))
}

func (h *ApiHandler) handleUpdateComponentTemplateNew(c echo.Context) error {
	componentTemplate, err := updateKappComponentTemplate(c)

	if err != nil {
		return err
	}

	return c.JSON(200, h.componentTemplateResponse(c, componentTemplate))
}

func (h *ApiHandler) handleDeleteComponentTemplateNew(c echo.Context) error {
	err := deleteKappComponentTemplate(c)
	if err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}

// Helper functions

func deleteKappComponentTemplate(c echo.Context) error {
	k8sClient := getK8sClient(c)
	_, err := k8sClient.RESTClient().Delete().Body(c.Request().Body).AbsPath(kappComponentTemplateUrl(c)).DoRaw()
	return err
}

func createKappComponentTemplate(c echo.Context) (*v1alpha1.ComponentTemplate, error) {
	k8sClient := getK8sClient(c)

	crdComponentTemplate, err := getComponentTemplateFromContext(c)

	if err != nil {
		return nil, err
	}

	bts, _ := json.Marshal(crdComponentTemplate)
	var componentTemplate v1alpha1.ComponentTemplate
	err = k8sClient.RESTClient().Post().Body(bts).AbsPath(kappComponentTemplateUrl(c)).Do().Into(&componentTemplate)
	if err != nil {
		return nil, err
	}
	return &componentTemplate, nil
}

func updateKappComponentTemplate(c echo.Context) (*v1alpha1.ComponentTemplate, error) {
	k8sClient := getK8sClient(c)

	crdComponentTemplate, err := getComponentTemplateFromContext(c)

	if err != nil {
		return nil, err
	}

	fetched, err := getKappComponentTemplate(c)

	if err != nil {
		return nil, err
	}

	crdComponentTemplate.ResourceVersion = fetched.ResourceVersion

	bts, _ := json.Marshal(crdComponentTemplate)
	var componentTemplate v1alpha1.ComponentTemplate
	err = k8sClient.RESTClient().Put().Body(bts).AbsPath(kappComponentTemplateUrl(c)).Do().Into(&componentTemplate)

	if err != nil {
		return nil, err
	}

	return &componentTemplate, nil
}

func getKappComponentTemplate(c echo.Context) (*v1alpha1.ComponentTemplate, error) {
	k8sClient := getK8sClient(c)
	var fetched v1alpha1.ComponentTemplate
	err := k8sClient.RESTClient().Get().AbsPath(kappComponentTemplateUrl(c)).Do().Into(&fetched)
	if err != nil {
		return nil, err
	}
	return &fetched, nil
}

func getKappComponentTemplateList(c echo.Context) (*v1alpha1.ComponentTemplateList, error) {
	k8sClient := getK8sClient(c)
	var fetched v1alpha1.ComponentTemplateList
	err := k8sClient.RESTClient().Get().AbsPath(kappComponentTemplateUrl(c)).Do().Into(&fetched)
	if err != nil {
		return nil, err
	}
	return &fetched, nil
}

func kappComponentTemplateUrl(c echo.Context) string {
	//namespace := c.Param("namespace")
	name := c.Param("name")

	//if namespace == "" && name == "" {
	//	return "/apis/core.kapp.dev/v1alpha1/componenttemplates"
	//}

	if name == "" {
		//return "/apis/core.kapp.dev/v1alpha1/namespaces/" + namespace + "/componenttemplates"
		return "/apis/core.kapp.dev/v1alpha1/componenttemplates"
	}
	return "/apis/core.kapp.dev/v1alpha1/componenttemplates/" + name
}

func getComponentTemplateFromContext(c echo.Context) (*v1alpha1.ComponentTemplate, error) {
	var req resources.CreateOrUpdateComponentTemplateRequest

	if err := c.Bind(&req); err != nil {
		return nil, err
	}

	crdComponentTemplate := &v1alpha1.ComponentTemplate{
		TypeMeta: metaV1.TypeMeta{
			Kind:       "ComponentTemplate",
			APIVersion: "core.kapp.dev/v1alpha1",
		},
		ObjectMeta: metaV1.ObjectMeta{
			Name: req.Name,
		},
		Spec: req,
	}

	return crdComponentTemplate, nil
}

func (*ApiHandler) componentTemplateResponse(_c echo.Context, componentTemplate *v1alpha1.ComponentTemplate) interface{} {
	return componentTemplate.Spec
}

func (*ApiHandler) componentTemplateListResponse(_c echo.Context, componentTemplateList *v1alpha1.ComponentTemplateList) interface{} {
	res := []interface{}{}

	for i := range componentTemplateList.Items {
		res = append(res, componentTemplateList.Items[i].Spec)
	}

	return res
}
