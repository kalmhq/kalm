package handler

import (
	"fmt"
	"github.com/kapp-staging/kapp/api/errors"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
	coreV1 "k8s.io/api/core/v1"
	rbacV1 "k8s.io/api/rbac/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
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
	Namespace string `json:"namespace" validate:"required,startswith=kapp-"`
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
	k8sClient := getK8sClient(c)

	bindings, err := k8sClient.RbacV1().RoleBindings("").List(ListAll)

	if err != nil {
		log.Error("list role bindings error", err)
		return err
	}

	res := RoleBindingResponse{
		RoleBindings: make([]RoleBindingItem, 0, len(bindings.Items)),
	}

	roleBindingsMap := make(map[string]map[string][]string)

	for _, binding := range bindings.Items {
		if !strings.HasPrefix(binding.Namespace, "kapp-") {
			continue
		}

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

	k8sClient := getK8sClient(c)

	for _, role := range body.Roles {
		subject := rbacV1.Subject{
			Kind:     body.Kind,
			APIGroup: "rbac.authorization.k8s.io",
			Name:     body.Name,
		}

		if body.Kind == "ServiceAccount" {
			subject.Namespace = "kapp-system"
			subject.APIGroup = ""

			// TODO, move this to a init place
			_, err := k8sClient.CoreV1().Namespaces().Create(&coreV1.Namespace{
				ObjectMeta: metaV1.ObjectMeta{Name: "kapp-system"},
			})

			if err != nil && !errors.IsAlreadyExists(err) {
				return err
			}

			// try to create the service account
			_, err = k8sClient.CoreV1().ServiceAccounts("kapp-system").Create(&coreV1.ServiceAccount{
				ObjectMeta: metaV1.ObjectMeta{
					Namespace: "kapp-system",
					Name:      subject.Name,
				},
			})

			if err != nil && !errors.IsAlreadyExists(err) {
				return err
			}
		}

		_, err = k8sClient.RbacV1().RoleBindings(body.Namespace).Create(&rbacV1.RoleBinding{
			ObjectMeta: metaV1.ObjectMeta{
				Name:      fmt.Sprintf("%s:%s:Role:%s", body.Kind, body.Name, role),
				Namespace: body.Namespace,
			},
			Subjects: []rbacV1.Subject{
				subject,
			},
			RoleRef: rbacV1.RoleRef{
				Kind:     "Role",
				Name:     string(role),
				APIGroup: "rbac.authorization.k8s.io",
			},
		})

		if errors.IsAlreadyExists(err) {
			continue
		}

		if err != nil {
			return err
		}
	}

	return c.NoContent(http.StatusOK)
}

func (h *ApiHandler) handleDeleteRoleBinding(c echo.Context) error {
	namespace := c.Param("namespace")
	name := c.Param("name")
	k8sClient := getK8sClient(c)

	err := k8sClient.RbacV1().RoleBindings(namespace).Delete(name, nil)

	if err != nil {
		return err
	}

	return c.NoContent(http.StatusOK)
}

func (h *ApiHandler) handleGetServiceAccount(c echo.Context) error {
	name := c.Param("name")
	k8sClient := getK8sClient(c)
	serviceaccount, err := k8sClient.CoreV1().ServiceAccounts("kapp-system").Get(name, metaV1.GetOptions{})

	if err != nil {
		return err
	}

	secret, err := k8sClient.CoreV1().Secrets("kapp-system").Get(serviceaccount.Secrets[0].Name, metaV1.GetOptions{})

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"token":  string(secret.Data["token"]),
		"ca.crt": string(secret.Data["ca.crt"]),
	})
}
