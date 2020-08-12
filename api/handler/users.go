package handler

import (
	"fmt"
	"github.com/kalmhq/kalm/api/errors"
	"github.com/kalmhq/kalm/api/log"
	"github.com/labstack/echo/v4"
	rbacV1 "k8s.io/api/rbac/v1"
	"net/http"
	"strings"
)

type Role string

const (
	// get application, pods status
	// view configs, logs
	RoleReader Role = "reader"

	// reader permissions
	// edit/delete application
	// use pod shell
	RoleWriter Role = "writer"
)

type RoleBindingsRequestBody struct {
	Name      string `json:"name" validate:"required"`
	Kind      string `json:"kind" validate:"required,oneof=User Group ServiceAccount"`
	Namespace string `json:"namespace" validate:"required,startswith=kalm-"`
	Roles     []Role `json:"roles,omitempty" validate:"gt=0,dive,oneof=reader writer"`
}

type Binding struct {
	RoleName  string `json:"roleName"`
	Namespace string `json:"namespace"`
	Name      string `json:"name"`
}

type RoleBindingItem struct {
	// entity name. eg: user name, group name, service account name
	Name string `json:"name"`

	// Group, User, ServiceAccount
	Kind string `json:"kind"`

	// key is namespace, values are roles
	Bindings []Binding `json:"bindings"`
}

type RoleBindingResponse struct {
	RoleBindings []RoleBindingItem `json:"roleBindings"`
}

func (h *ApiHandler) handleListRoleBindings(c echo.Context) error {
	bindings, err := h.Builder(c).ListRoleBindings("")

	if err != nil {
		log.Error(err, "list role bindings error")
		return err
	}

	res := RoleBindingResponse{
		RoleBindings: make([]RoleBindingItem, 0, len(bindings)),
	}

	roleBindingsMap := make(map[string]map[string][]string)

	for _, binding := range bindings {
		for _, subject := range binding.Subjects {
			key := fmt.Sprintf("%s__SEP__%s", subject.Kind, subject.Name)

			if _, ok := roleBindingsMap[key]; !ok {
				roleBindingsMap[key] = make(map[string][]string)
			}

			if _, ok := roleBindingsMap[key][binding.Namespace]; !ok {
				roleBindingsMap[key][binding.Namespace] = make([]string, 0)
			}

			roleBindingsMap[key][binding.Namespace] = append(roleBindingsMap[key][binding.Namespace], binding.RoleRef.Name)
		}
	}

	for k, v := range roleBindingsMap {
		parts := strings.Split(k, "__SEP__")
		kind := parts[0]
		name := parts[1]

		bindings := make([]Binding, 0, len(v))

		for namespace, roles := range v {
			for _, role := range roles {
				bindings = append(bindings, Binding{
					RoleName:  role,
					Namespace: namespace,
					Name:      fmt.Sprintf("%s:%s:Role:%s", kind, name, role),
				})
			}
		}

		res.RoleBindings = append(res.RoleBindings, RoleBindingItem{
			Name:     name,
			Kind:     kind,
			Bindings: bindings,
		})
	}

	return c.JSON(http.StatusOK, res)
}

func (h *ApiHandler) handleCreateRoleBinding(c echo.Context) (err error) {
	body := new(RoleBindingsRequestBody)

	if err := c.Bind(body); err != nil {
		return err
	}

	if err := c.Validate(body); err != nil {
		return err
	}

	for _, role := range body.Roles {
		subject := rbacV1.Subject{
			Kind:     body.Kind,
			APIGroup: "rbac.authorization.k8s.io",
			Name:     body.Name,
		}

		if body.Kind == "ServiceAccount" {
			subject.Namespace = "kalm-system"
			subject.APIGroup = ""

			err = h.Builder(c).CreateKalmServiceAccount(subject.Name)
			if err != nil && !errors.IsAlreadyExists(err) {
				return err
			}
		}

		err := h.Builder(c).CreateRoleBinding(body.Namespace, subject, string(role))

		if err != nil && errors.IsAlreadyExists(err) {
			continue
		}

		if err != nil {
			return err
		}
	}

	return c.NoContent(http.StatusOK)
}

func (h *ApiHandler) handleDeleteRoleBinding(c echo.Context) error {
	err := h.Builder(c).DeleteRoleBinding(c.Param("namespace"), c.Param("name"))

	if err != nil {
		return err
	}

	return c.NoContent(http.StatusOK)
}

func (h *ApiHandler) resolveClusterRole() error {
	return nil
}

func (h *ApiHandler) handleGetServiceAccount(c echo.Context) error {
	token, crt, err := h.Builder(c).GetServiceAccountSecrets(c.Param("name"))

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"token":  string(token),
		"ca.crt": string(crt),
	})
}
