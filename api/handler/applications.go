package handler

import (
	"encoding/json"
	"github.com/kapp-staging/kapp/api/resources"
	"github.com/kapp-staging/kapp/controller/controllers"
	"github.com/labstack/echo/v4"
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
)

func (h *ApiHandler) handleGetApplications(c echo.Context) error {
	applicationList, err := getKappNamespaceList(c)

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
	application, err := getKappApplication(c)

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
//	crdApplication, _, err := getKappNamespaceFromContext(c)
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
	application, err := createKappNamespace(c)

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
	application, err := updateKappApplication(c)

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
	err := deleteKappApplication(c)
	if err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}

// Helper functions

func deleteKappApplication(c echo.Context) error {
	k8sClient := getK8sClient(c)
	_, err := k8sClient.RESTClient().Delete().Body(c.Request().Body).AbsPath(kappNamespaceUrl(c)).DoRaw()
	return err
}

func createKappNamespace(c echo.Context) (coreV1.Namespace, error) {
	k8sClient := getK8sClient(c)

	kappNamespace, err := getKappNamespaceFromContext(c)
	if err != nil {
		return coreV1.Namespace{}, err
	}

	bts, _ := json.Marshal(kappNamespace)
	var application coreV1.Namespace
	err = k8sClient.RESTClient().Post().Body(bts).AbsPath(kappNamespaceUrl(c)).Do().Into(&application)
	if err != nil {
		return coreV1.Namespace{}, err
	}

	//kappClient, _ := getKappV1Alpha1Client(c)
	//err = resources.UpdateApplicationPluginBindingsForObject(kappClient, application.Name, "", plugins)
	//if err != nil {
	//	return nil, err
	//}

	return application, nil
}

func updateKappApplication(c echo.Context) (coreV1.Namespace, error) {
	k8sClient := getK8sClient(c)

	crdApplication, err := getKappNamespaceFromContext(c)

	if err != nil {
		return coreV1.Namespace{}, err
	}

	fetched, err := getKappApplication(c)
	if err != nil {
		return coreV1.Namespace{}, err
	}

	crdApplication.ResourceVersion = fetched.ResourceVersion

	bts, _ := json.Marshal(crdApplication)
	var kappNS coreV1.Namespace
	err = k8sClient.RESTClient().Put().Body(bts).AbsPath(kappNamespaceUrl(c)).Do().Into(&kappNS)
	if err != nil {
		return coreV1.Namespace{}, err
	}

	return kappNS, nil
}

func getKappApplication(c echo.Context) (coreV1.Namespace, error) {
	k8sClient := getK8sClient(c)
	var fetched coreV1.Namespace
	err := k8sClient.RESTClient().Get().AbsPath(kappNamespaceUrl(c)).Do().Into(&fetched)
	if err != nil {
		return coreV1.Namespace{}, err
	}
	return fetched, nil
}

func getKappNamespaceList(c echo.Context) (coreV1.NamespaceList, error) {
	k8sClient := getK8sClient(c)
	var fetched coreV1.NamespaceList
	err := k8sClient.RESTClient().Get().AbsPath(kappNamespaceUrl(c)).Do().Into(&fetched)
	if err != nil {
		return coreV1.NamespaceList{}, err
	}

	return fetched, nil
}

func kappNamespaceUrl(c echo.Context) string {
	name := c.Param("name")

	if name == "" {
		return "/api/v1/namespaces"
	}

	return "/api/v1/namespaces/" + name
}

func getKappNamespaceFromContext(c echo.Context) (coreV1.Namespace, error) {
	var application resources.Application

	if err := c.Bind(&application); err != nil {
		return coreV1.Namespace{}, err
	}

	var kappEnabledVal string
	if application.IsActive {
		kappEnabledVal = controllers.KappEnableLabelValue
	} else {
		kappEnabledVal = "false"
	}

	crdApplication := coreV1.Namespace{
		ObjectMeta: metaV1.ObjectMeta{
			Name: application.Name,
			Labels: map[string]string{
				controllers.KappEnableLabelName: kappEnabledVal,
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
