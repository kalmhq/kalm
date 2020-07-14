package handler

import (
	"encoding/json"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/controllers"
	"github.com/labstack/echo/v4"
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
)

func (h *ApiHandler) handleGetApplications(c echo.Context) error {
	applicationList, err := getKalmNamespaceList(c)

	if err != nil {
		return err
	}

	res, err := h.applicationListResponse(c, applicationList)

	if err != nil {
		return err
	}

	return c.JSON(200, res)
}

func (h *ApiHandler) handleGetApplicationDetails(c echo.Context) error {
	application, err := getKalmApplication(c)

	if err != nil {
		return err
	}

	res, err := h.applicationResponse(c, application)

	if err != nil {
		return err
	}

	return c.JSON(200, res)
}

//func (h *ApiHandler) handleValidateApplications(c echo.Context) error {
//	crdApplication, _, err := getKalmNamespaceFromContext(c)
//	if err != nil {
//		return err
//	}
//
//	if err := v1alpha1.TryValidateApplicationFromAPI(crdApplication.Spec, crdApplication.Name); err != nil {
//		return err
//	}
//
//	return nil
//}

func (h *ApiHandler) handleCreateApplication(c echo.Context) error {
	application, err := createKalmNamespace(c)

	if err != nil {
		return err
	}

	res, err := h.applicationResponse(c, application)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, res)
}

func (h *ApiHandler) handleUpdateApplication(c echo.Context) error {
	application, err := updateKalmApplication(c)

	if err != nil {
		return err
	}

	res, err := h.applicationResponse(c, application)

	if err != nil {
		return err
	}

	return c.JSON(200, res)
}

func (h *ApiHandler) handleDeleteApplication(c echo.Context) error {
	err := deleteKalmApplication(c)
	if err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}

// Helper functions

func deleteKalmApplication(c echo.Context) error {
	k8sClient := getK8sClient(c)
	_, err := k8sClient.RESTClient().Delete().Body(c.Request().Body).AbsPath(kalmNamespaceUrl(c)).DoRaw()
	return err
}

func createKalmNamespace(c echo.Context) (coreV1.Namespace, error) {
	k8sClient := getK8sClient(c)

	kalmNamespace, err := getKalmNamespaceFromContext(c)
	if err != nil {
		return coreV1.Namespace{}, err
	}

	bts, _ := json.Marshal(kalmNamespace)
	var application coreV1.Namespace
	err = k8sClient.RESTClient().Post().Body(bts).AbsPath(kalmNamespaceUrl(c)).Do().Into(&application)
	if err != nil {
		return coreV1.Namespace{}, err
	}

	//kalmClient, _ := getKalmV1Alpha1Client(c)
	//err = resources.UpdateApplicationPluginBindingsForObject(kalmClient, application.Name, "", plugins)
	//if err != nil {
	//	return nil, err
	//}

	return application, nil
}

func updateKalmApplication(c echo.Context) (coreV1.Namespace, error) {
	k8sClient := getK8sClient(c)

	crdApplication, err := getKalmNamespaceFromContext(c)

	if err != nil {
		return coreV1.Namespace{}, err
	}

	fetched, err := getKalmApplication(c)
	if err != nil {
		return coreV1.Namespace{}, err
	}

	crdApplication.ResourceVersion = fetched.ResourceVersion

	bts, _ := json.Marshal(crdApplication)
	var kalmNS coreV1.Namespace
	err = k8sClient.RESTClient().Put().Body(bts).AbsPath(kalmNamespaceUrl(c)).Do().Into(&kalmNS)
	if err != nil {
		return coreV1.Namespace{}, err
	}

	return kalmNS, nil
}

func getKalmApplication(c echo.Context) (coreV1.Namespace, error) {
	k8sClient := getK8sClient(c)
	var fetched coreV1.Namespace
	err := k8sClient.RESTClient().Get().AbsPath(kalmNamespaceUrl(c)).Do().Into(&fetched)
	if err != nil {
		return coreV1.Namespace{}, err
	}
	return fetched, nil
}

func getKalmNamespaceList(c echo.Context) (coreV1.NamespaceList, error) {
	k8sClient := getK8sClient(c)
	var fetched coreV1.NamespaceList
	err := k8sClient.RESTClient().Get().AbsPath(kalmNamespaceUrl(c)).Do().Into(&fetched)
	if err != nil {
		return coreV1.NamespaceList{}, err
	}

	return fetched, nil
}

func kalmNamespaceUrl(c echo.Context) string {
	name := c.Param("name")

	if name == "" {
		return "/api/v1/namespaces"
	}

	return "/api/v1/namespaces/" + name
}

func getKalmNamespaceFromContext(c echo.Context) (coreV1.Namespace, error) {
	var application resources.Application

	if err := c.Bind(&application); err != nil {
		return coreV1.Namespace{}, err
	}

	crdApplication := coreV1.Namespace{
		ObjectMeta: metaV1.ObjectMeta{
			Name: application.Name,
			Labels: map[string]string{
				controllers.KalmEnableLabelName: controllers.KalmEnableLabelValue,
			},
		},
	}

	return crdApplication, nil
}

func (h *ApiHandler) applicationResponse(c echo.Context, ns coreV1.Namespace) (*resources.ApplicationDetails, error) {
	k8sClient := getK8sClient(c)
	k8sClientConfig := getK8sClientConfig(c)
	builder := resources.NewBuilder(k8sClient, k8sClientConfig, h.logger)
	return builder.BuildApplicationDetails(ns)
}

func (h *ApiHandler) applicationListResponse(
	c echo.Context,
	namespaceList coreV1.NamespaceList,
) ([]resources.ApplicationDetails, error) {

	k8sClient := getK8sClient(c)
	k8sClientConfig := getK8sClientConfig(c)
	builder := resources.NewBuilder(k8sClient, k8sClientConfig, h.logger)

	return builder.BuildApplicationListResponse(namespaceList)
}
