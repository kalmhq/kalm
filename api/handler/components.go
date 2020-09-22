package handler

import (
	client2 "github.com/kalmhq/kalm/api/client"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	"k8s.io/apimachinery/pkg/api/errors"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"net/http"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (h *ApiHandler) handleListComponents(c echo.Context) error {
	componentList, err := h.getComponentList(c)

	if err != nil {
		return err
	}

	res, err := h.componentListResponse(c, componentList)

	if err != nil {
		return err
	}

	return c.JSON(200, res)
}

func (h *ApiHandler) handleCreateComponent(c echo.Context) error {
	component, err := h.createComponent(c)

	if err != nil {
		return err
	}

	res, err := h.componentResponse(c, component)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, res)
}

func (h *ApiHandler) handleUpdateComponent(c echo.Context) error {
	component, err := h.updateComponent(c)

	if err != nil {
		return err
	}

	res, err := h.componentResponse(c, component)

	if err != nil {
		return err
	}

	return c.JSON(200, res)
}

func (h *ApiHandler) handleGetComponent(c echo.Context) error {
	component, err := h.getComponent(c)

	if err != nil {
		return err
	}

	res, err := h.componentResponse(c, component)

	if err != nil {
		return err
	}

	return c.JSON(200, res)
}

func (h *ApiHandler) handleDeleteComponent(c echo.Context) error {
	err := h.deleteComponent(c)
	if err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}

// helper

func (h *ApiHandler) deleteComponent(c echo.Context) error {
	if !h.clientManager.CanEditNamespace(getCurrentUser(c), c.Param("applicationName")) {
		return resources.NoNamespaceEditorRoleError(c.Param("applicationName"))
	}

	err := h.resourceManager.Delete(&v1alpha1.Component{ObjectMeta: metaV1.ObjectMeta{
		Name:      c.Param("name"),
		Namespace: c.Param("applicationName"),
	}})

	return err
}

func (h *ApiHandler) getComponent(c echo.Context) (*v1alpha1.Component, error) {
	if !h.clientManager.CanViewNamespace(getCurrentUser(c), c.Param("applicationName")) {
		return nil, resources.NoNamespaceViewerRoleError(c.Param("applicationName"))
	}

	var component v1alpha1.Component
	err := h.resourceManager.Get(c.Param("applicationName"), c.Param("name"), &component)

	if err != nil {
		return nil, err
	}

	return &component, nil
}

func (h *ApiHandler) getComponentList(c echo.Context) (*v1alpha1.ComponentList, error) {
	if !h.clientManager.CanViewNamespace(getCurrentUser(c), c.Param("applicationName")) {
		return nil, resources.NoNamespaceViewerRoleError(c.Param("applicationName"))
	}

	var fetched v1alpha1.ComponentList
	err := h.resourceManager.List(&fetched, client.InNamespace(c.Param("applicationName")))
	if err != nil {
		return nil, err
	}
	return &fetched, nil
}

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

func (h *ApiHandler) createComponent(c echo.Context) (*v1alpha1.Component, error) {
	if !h.clientManager.CanEditNamespace(getCurrentUser(c), c.Param("applicationName")) {
		return nil, resources.NoNamespaceEditorRoleError(c.Param("applicationName"))
	}

	crdComponent, plugins, err := getComponentFromContext(c)
	if err != nil {
		return nil, err
	}

	//permission, check if component try to re-use disk from other ns
	err = h.checkPermissionOnVolume(getCurrentUser(c), crdComponent.Spec.Volumes)
	if err != nil {
		return nil, err
	}

	crdComponent.Namespace = c.Param("applicationName")
	err = h.resourceManager.Create(crdComponent)
	if err != nil {
		return nil, err
	}

	err = h.resourceManager.UpdateComponentPluginBindingsForObject(crdComponent.Namespace, crdComponent.Name, plugins)

	if err != nil {
		return nil, err
	}
	return crdComponent, nil
}

func (h *ApiHandler) updateComponent(c echo.Context) (*v1alpha1.Component, error) {
	crdComponent, plugins, err := getComponentFromContext(c)

	if err != nil {
		return nil, err
	}

	if !h.clientManager.CanEditNamespace(getCurrentUser(c), crdComponent.Namespace) {
		return nil, resources.NoNamespaceEditorRoleError(crdComponent.Namespace)
	}

	if err := h.resourceManager.Apply(crdComponent); err != nil {
		return nil, err
	}

	err = h.resourceManager.UpdateComponentPluginBindingsForObject(crdComponent.Namespace, crdComponent.Name, plugins)

	if err != nil {
		return nil, err
	}

	return crdComponent, nil
}

func getComponentFromContext(c echo.Context) (*v1alpha1.Component, []runtime.RawExtension, error) {
	var component resources.Component

	if err := c.Bind(&component); err != nil {
		return nil, nil, err
	}

	name := c.Param("name")

	if name == "" {
		name = component.Name
	}

	crdComponent := &v1alpha1.Component{
		TypeMeta: metaV1.TypeMeta{
			Kind:       "Component",
			APIVersion: "core.kalm.dev/v1alpha1",
		},
		ObjectMeta: metaV1.ObjectMeta{
			Name:      name,
			Namespace: c.Param("applicationName"),
		},
		Spec: component.ComponentSpec,
	}

	return crdComponent, component.Plugins, nil
}

func (h *ApiHandler) componentResponse(c echo.Context, component *v1alpha1.Component) (*resources.ComponentDetails, error) {
	return h.resourceManager.BuildComponentDetails(component, nil)
}

func (h *ApiHandler) componentListResponse(c echo.Context, componentList *v1alpha1.ComponentList) ([]resources.ComponentDetails, error) {
	return h.resourceManager.BuildComponentDetailsResponse(componentList)
}
