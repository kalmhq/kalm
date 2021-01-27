package handler

import (
	"net/http"

	client2 "github.com/kalmhq/kalm/api/client"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	"k8s.io/apimachinery/pkg/api/errors"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (h *ApiHandler) InstallComponentsHandlers(e *echo.Group) {
	e.GET("/applications/:applicationName/components", h.handleListComponents)
	e.GET("/applications/:applicationName/components/:name", h.handleGetComponent)
	e.PUT("/applications/:applicationName/components/:name", h.handleUpdateComponent)
	e.DELETE("/applications/:applicationName/components/:name", h.handleDeleteComponent)
	e.POST("/applications/:applicationName/components", h.handleCreateComponent)
	e.POST("/applications/:applicationName/components/:name/jobs", h.handleTriggerJob)
}

func (h *ApiHandler) handleListComponents(c echo.Context) error {
	currentUser := getCurrentUser(c)
	h.MustCanView(currentUser, c.Param("applicationName"), "components/*")

	var componentList v1alpha1.ComponentList

	if err := h.resourceManager.List(
		&componentList,
		client.InNamespace(c.Param("applicationName")),
	); err != nil {
		return err
	}

	res, err := h.componentListResponse(&componentList)

	if err != nil {
		return err
	}

	return c.JSON(200, res)
}

func (h *ApiHandler) handleTriggerJob(c echo.Context) error {
	currentUser := getCurrentUser(c)
	applicationName := c.Param("applicationName")
	componentName := c.Param("name")
	h.MustCanEdit(currentUser, applicationName, "components/"+componentName)

	var component v1alpha1.Component
	if err := h.resourceManager.Get(applicationName, c.Param("name"), &component); err != nil {
		return err
	}

	if component.Spec.WorkloadType != v1alpha1.WorkloadTypeCronjob {
		return errors.NewBadRequest("component is not a cronjob")
	}

	component.TypeMeta = metaV1.TypeMeta{
		Kind:       "Component",
		APIVersion: "core.kalm.dev/v1alpha1",
	}
	copied := component.DeepCopy()
	copied.Spec.ImmediateTrigger = true

	if err := h.resourceManager.Apply(copied); err != nil {
		return err
	}

	return c.NoContent(http.StatusNoContent)
}

func (h *ApiHandler) handleCreateComponent(c echo.Context) error {
	currentUser := getCurrentUser(c)
	h.MustCanEdit(currentUser, c.Param("applicationName"), "components/*")

	component, err := bindResourcesComponentFromRequestBody(c)

	if err != nil {
		return err
	}

	crdComponent := getCrdComponent(component)

	// permission, check if component try to re-use disk from other ns
	if err := h.checkPermissionOnVolume(currentUser, crdComponent.Spec.Volumes); err != nil {
		return err
	}

	if err := h.resourceManager.Create(crdComponent); err != nil {
		return err
	}

	if err := h.resourceManager.UpdateProtectedEndpointForComponent(crdComponent, component.ProtectedEndpointSpec); err != nil {
		return err
	}

	if err := h.resourceManager.UpdateComponentPluginBindingsForObject(crdComponent.Namespace, crdComponent.Name, component.Plugins); err != nil {
		return err
	}

	if err != nil {
		return err
	}

	res, err := h.componentResponse(crdComponent)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, res)
}

func (h *ApiHandler) handleUpdateComponent(c echo.Context) error {
	component, err := bindResourcesComponentFromRequestBody(c)

	if err != nil {
		return err
	}

	currentUser := getCurrentUser(c)

	component.Name = c.Param("name")

	h.MustCanEdit(currentUser, c.Param("applicationName"), "components/"+component.Name)

	crdComponent := getCrdComponent(component)

	if err := h.resourceManager.Apply(crdComponent); err != nil {
		return err
	}

	if err := h.resourceManager.UpdateProtectedEndpointForComponent(crdComponent, component.ProtectedEndpointSpec); err != nil {
		return err
	}

	if err := h.resourceManager.UpdateComponentPluginBindingsForObject(crdComponent.Namespace, crdComponent.Name, component.Plugins); err != nil {
		return err
	}

	if err != nil {
		return err
	}

	res, err := h.componentResponse(crdComponent)

	if err != nil {
		return err
	}

	return c.JSON(200, res)
}

func (h *ApiHandler) handleGetComponent(c echo.Context) error {
	currentUser := getCurrentUser(c)
	h.MustCanView(currentUser, c.Param("applicationName"), "components/"+c.Param("name"))

	var component v1alpha1.Component
	if err := h.resourceManager.Get(c.Param("applicationName"), c.Param("name"), &component); err != nil {
		return err
	}

	res, err := h.componentResponse(&component)

	if err != nil {
		return err
	}

	return c.JSON(200, res)
}

func (h *ApiHandler) handleDeleteComponent(c echo.Context) error {
	currentUser := getCurrentUser(c)
	h.MustCanEdit(currentUser, c.Param("applicationName"), "components/"+c.Param("name"))

	if err := h.resourceManager.Delete(&v1alpha1.Component{ObjectMeta: metaV1.ObjectMeta{
		Name:      c.Param("name"),
		Namespace: c.Param("applicationName"),
	}}); err != nil {
		return err
	}

	return c.NoContent(http.StatusNoContent)
}

// helper

func (h *ApiHandler) checkPermissionOnVolume(c *client2.ClientInfo, vols []v1alpha1.Volume) error {
	for _, vol := range vols {
		if vol.Type != v1alpha1.VolumeTypePersistentVolumeClaim {
			continue
		}

		if vol.PVToMatch == "" {
			continue
		}

		pv, err := h.resourceManager.GetPV(vol.PVToMatch)
		if err != nil {
			if errors.IsNotFound(err) {
				//ignore
				continue
			}

			return err
		}

		boundingPVC, err := h.resourceManager.GetBoundingPVC(pv)
		if err != nil {
			return err
		}

		if boundingPVC == nil {
			continue
		}

		if !h.clientManager.CanEditNamespace(c, boundingPVC.Namespace) {
			return resources.NoNamespaceEditorRoleError(boundingPVC.Namespace)
		}
	}

	return nil
}

func getCrdComponent(component *resources.Component) *v1alpha1.Component {
	crdComponent := &v1alpha1.Component{
		TypeMeta: metaV1.TypeMeta{
			Kind:       "Component",
			APIVersion: "core.kalm.dev/v1alpha1",
		},
		ObjectMeta: metaV1.ObjectMeta{
			Name:      component.Name,
			Namespace: component.Namespace,
		},
		Spec: *component.ComponentSpec,
	}

	return crdComponent
}

func bindResourcesComponentFromRequestBody(c echo.Context) (*resources.Component, error) {
	var component resources.Component

	if err := c.Bind(&component); err != nil {
		return nil, err
	}

	component.Namespace = c.Param("applicationName")

	return &component, nil
}

func (h *ApiHandler) componentResponse(component *v1alpha1.Component) (*resources.ComponentDetails, error) {
	return h.resourceManager.BuildComponentDetails(component, nil)
}

func (h *ApiHandler) componentListResponse(componentList *v1alpha1.ComponentList) ([]resources.ComponentDetails, error) {
	return h.resourceManager.BuildComponentDetailsResponse(componentList)
}
