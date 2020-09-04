package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (h *ApiHandler) handleListRoleBindings(c echo.Context) error {
	var roleBindingList v1alpha1.RoleBindingList

	if err := h.resourceManager.List(&roleBindingList); err != nil {
		return err
	}

	roleBindings := h.filterAuthorizedRoleBindings(c, roleBindingList.Items)

	res := make([]*resources.RoleBinding, 0, len(roleBindings))
	for i := range roleBindings {
		res = append(res, &resources.RoleBinding{
			Namespace:       roleBindings[i].Namespace,
			Name:            roleBindings[i].Name,
			RoleBindingSpec: &roleBindings[i].Spec,
		})
	}

	return c.JSON(http.StatusOK, res)
}

func (h *ApiHandler) handleCreateRoleBinding(c echo.Context) (err error) {
	roleBinding, err := getRoleBindingFromContext(c)

	if err != nil {
		return err
	}

	switch roleBinding.Spec.Role {
	case v1alpha1.ClusterRoleViewer, v1alpha1.ClusterRoleEditor, v1alpha1.ClusterRoleOwner:
		if !h.clientManager.CanManageCluster(getCurrentUser(c)) {
			return resources.NoClusterOwnerRoleError
		}
	default:
		if !h.clientManager.CanManageNamespace(getCurrentUser(c), roleBinding.Namespace) {
			return resources.NoNamespaceManagerRoleError(roleBinding.Namespace)
		}
	}

	roleBinding.Name = roleBinding.GetNameBaseOnRoleAndSubject()
	roleBinding.Spec.Creator = getCurrentUser(c).Name

	if err := h.resourceManager.Create(roleBinding); err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, roleBinding)
}

func (h *ApiHandler) handleUpdateRoleBinding(c echo.Context) error {
	roleBinding, err := getRoleBindingFromContext(c)

	if err != nil {
		return err
	}

	switch roleBinding.Spec.Role {
	case v1alpha1.ClusterRoleViewer, v1alpha1.ClusterRoleEditor, v1alpha1.ClusterRoleOwner:
		if !h.clientManager.CanManageCluster(getCurrentUser(c)) {
			return resources.NoClusterOwnerRoleError
		}
	default:
		if !h.clientManager.CanManageNamespace(getCurrentUser(c), roleBinding.Namespace) {
			return resources.NoNamespaceManagerRoleError(roleBinding.Namespace)
		}
	}

	var fetched v1alpha1.RoleBinding
	if err := h.resourceManager.Get(roleBinding.Namespace, roleBinding.Name, &fetched); err != nil {
		return err
	}

	copied := fetched.DeepCopy()
	copied.Spec.Role = roleBinding.Spec.Role

	if err := h.resourceManager.Patch(copied, client.MergeFrom(&fetched)); err != nil {
		return err
	}

	return c.JSON(http.StatusOK, roleBinding)
}

func (h *ApiHandler) handleDeleteRoleBinding(c echo.Context) error {
	var fetched v1alpha1.RoleBinding

	if err := h.resourceManager.Get(c.Param("namespace"), c.Param("name"), &fetched); err != nil {
		return err
	}

	switch fetched.Spec.Role {
	case v1alpha1.ClusterRoleViewer, v1alpha1.ClusterRoleEditor, v1alpha1.ClusterRoleOwner:
		if !h.clientManager.CanManageCluster(getCurrentUser(c)) {
			return resources.NoClusterOwnerRoleError
		}
	default:
		if !h.clientManager.CanManageNamespace(getCurrentUser(c), fetched.Namespace) {
			return resources.NoNamespaceManagerRoleError(fetched.Namespace)
		}
	}

	err := h.resourceManager.Delete(&fetched)

	if err != nil {
		return err
	}

	return c.NoContent(http.StatusOK)
}

func (h *ApiHandler) resolveClusterRole() error {
	return nil
}

func (h *ApiHandler) handleGetServiceAccount(c echo.Context) error {
	token, crt, err := h.resourceManager.GetServiceAccountSecrets(c.Param("name"))

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"token":  string(token),
		"ca.crt": string(crt),
	})
}

func getRoleBindingFromContext(c echo.Context) (*v1alpha1.RoleBinding, error) {
	var roleBinding resources.RoleBinding

	if err := c.Bind(&roleBinding); err != nil {
		return nil, err
	}

	coreV1Namespace := &v1alpha1.RoleBinding{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      roleBinding.Name,
			Namespace: roleBinding.Namespace,
		},
		Spec: *roleBinding.RoleBindingSpec,
	}

	return coreV1Namespace, nil
}

func (h *ApiHandler) filterAuthorizedRoleBindings(c echo.Context, records []v1alpha1.RoleBinding) []v1alpha1.RoleBinding {
	l := len(records)

	for i := 0; i < l; i++ {
		canView := false

		switch records[i].Spec.Role {
		case v1alpha1.ClusterRoleViewer, v1alpha1.ClusterRoleEditor, v1alpha1.ClusterRoleOwner:
			canView = h.clientManager.CanManageCluster(getCurrentUser(c))
		default:
			canView = h.clientManager.CanManageNamespace(getCurrentUser(c), records[i].Namespace)
		}

		if !canView {
			records[l-1], records[i] = records[i], records[l-1]
			i--
			l--
		}
	}

	return records[:l]
}
