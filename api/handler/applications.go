package handler

import (
	"encoding/json"
	"net/http"

	"github.com/kapp-staging/kapp/api/resources"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (h *ApiHandler) handleGetApplications(c echo.Context) error {
	applicationList, err := getKappApplicationList(c)

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

	return c.JSON(200, h.applicationResponse(c, application))
}

func (h *ApiHandler) handleCreateApplicationNew(c echo.Context) error {
	application, err := createKappApplication(c)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, h.applicationResponse(c, application))
}

func (h *ApiHandler) handleUpdateApplicationNew(c echo.Context) error {
	application, err := updateKappApplication(c)

	if err != nil {
		return err
	}

	return c.JSON(200, h.applicationResponse(c, application))
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
	_, err := k8sClient.RESTClient().Delete().Body(c.Request().Body).AbsPath(kappApplicationUrl(c)).DoRaw()
	return err
}

func createKappApplication(c echo.Context) (*v1alpha1.Application, error) {
	k8sClient := getK8sClient(c)

	crdApplication, err := getApplicationFromContext(c)

	if err != nil {
		return nil, err
	}

	_, err = k8sClient.CoreV1().Namespaces().Get(crdApplication.Namespace, metaV1.GetOptions{TypeMeta: metaV1.TypeMeta{Kind: "Namespace", APIVersion: "v1"}})

	if errors.IsNotFound(err) {
		_, err = k8sClient.CoreV1().Namespaces().Create(&v1.Namespace{
			TypeMeta: metaV1.TypeMeta{
				Kind:       "Namespace",
				APIVersion: "v1",
			},
			ObjectMeta: metaV1.ObjectMeta{
				Name: crdApplication.Namespace,
			},
		})

		if err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}

	bts, _ := json.Marshal(crdApplication)
	var application v1alpha1.Application
	err = k8sClient.RESTClient().Post().Body(bts).AbsPath(kappApplicationUrl(c)).Do().Into(&application)
	if err != nil {
		return nil, err
	}
	return &application, nil
}

func updateKappApplication(c echo.Context) (*v1alpha1.Application, error) {
	k8sClient := getK8sClient(c)

	crdApplication, err := getApplicationFromContext(c)

	if err != nil {
		return nil, err
	}

	fetched, err := getKappApplication(c)

	if err != nil {
		return nil, err
	}
	crdApplication.ResourceVersion = fetched.ResourceVersion

	bts, _ := json.Marshal(crdApplication)
	var application v1alpha1.Application
	err = k8sClient.RESTClient().Put().Body(bts).AbsPath(kappApplicationUrl(c)).Do().Into(&application)

	if err != nil {
		return nil, err
	}

	return &application, nil
}

func getKappApplication(c echo.Context) (*v1alpha1.Application, error) {
	k8sClient := getK8sClient(c)
	var fetched v1alpha1.Application
	err := k8sClient.RESTClient().Get().AbsPath(kappApplicationUrl(c)).Do().Into(&fetched)
	if err != nil {
		return nil, err
	}
	return &fetched, nil
}

func getKappApplicationList(c echo.Context) (*v1alpha1.ApplicationList, error) {
	k8sClient := getK8sClient(c)
	var fetched v1alpha1.ApplicationList
	err := k8sClient.RESTClient().Get().AbsPath(kappApplicationUrl(c)).Do().Into(&fetched)
	if err != nil {
		return nil, err
	}
	return &fetched, nil
}

func kappApplicationUrl(c echo.Context) string {
	namespace := c.Param("namespace")
	name := c.Param("name")

	if namespace == "" && name == "" {
		return "/apis/core.kapp.dev/v1alpha1/applications"
	}

	if name == "" {
		return "/apis/core.kapp.dev/v1alpha1/namespaces/" + namespace + "/applications"
	}

	return "/apis/core.kapp.dev/v1alpha1/namespaces/" + namespace + "/applications/" + name
}

func getApplicationFromContext(c echo.Context) (*v1alpha1.Application, error) {
	var req resources.CreateOrUpdateApplicationRequest

	if err := c.Bind(&req); err != nil {
		return nil, err
	}

	crdApplication := &v1alpha1.Application{
		TypeMeta: metaV1.TypeMeta{
			Kind:       "Application",
			APIVersion: "core.kapp.dev/v1alpha1",
		},
		ObjectMeta: metaV1.ObjectMeta{
			Namespace: req.Application.Namespace,
			Name:      req.Application.Name,
		},
		Spec: v1alpha1.ApplicationSpec{
			IsActive:   req.Application.IsActive,
			SharedEnv:  req.Application.SharedEnvs,
			Components: req.Application.Components,
		},
	}

	return crdApplication, nil
}

func (h *ApiHandler) applicationResponse(c echo.Context, application *v1alpha1.Application) *resources.ApplicationResponse {
	k8sClient := getK8sClient(c)
	k8sClientConfig := getK8sClientConfig(c)

	builder := resources.Builder{
		K8sClient: k8sClient,
		Logger:    h.logger,
		Config:    k8sClientConfig,
	}

	return builder.BuildApplicationDetailsResponse(application)
}

func (h *ApiHandler) applicationListResponse(c echo.Context, applicationList *v1alpha1.ApplicationList) (*resources.ApplicationListResponse, error) {
	k8sClient := getK8sClient(c)
	k8sClientConfig := getK8sClientConfig(c)

	builder := resources.Builder{
		K8sClient: k8sClient,
		Logger:    h.logger,
		Config:    k8sClientConfig,
	}

	return builder.BuildApplicationListResponse(applicationList)
}
