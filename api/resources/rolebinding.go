package resources

import (
	"fmt"
	rbacV1 "k8s.io/api/rbac/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"strings"
)

type RoleBindingListChannel struct {
	List  chan []rbacV1.RoleBinding
	Error chan error
}

func (resourceManager *ResourceManager) getRoleBindingListChannel(namespace string) *RoleBindingListChannel {
	channel := &RoleBindingListChannel{
		List:  make(chan []rbacV1.RoleBinding, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var res rbacV1.RoleBindingList
		err := resourceManager.List(&res, client.InNamespace(namespace))

		if err != nil {
			channel.List <- nil
			channel.Error <- err
			return
		}

		list := make([]rbacV1.RoleBinding, 0, len(res.Items))

		for _, item := range res.Items {
			if !strings.HasPrefix(item.Namespace, KALM_NAMESPACE_PREFIX) {
				continue
			}

			if item.Namespace == KALM_SYSTEM_NAMESPACE {
				continue
			}

			list = append(list, item)
		}

		channel.List <- list
		channel.Error <- nil
	}()

	return channel
}

func (resourceManager *ResourceManager) ListRoleBindings(namespace string) ([]rbacV1.RoleBinding, error) {
	resourceChannels := &ResourceChannels{
		RoleBindingList: resourceManager.getRoleBindingListChannel(namespace),
	}

	resources, err := resourceChannels.ToResources()

	if err != nil {
		return nil, err
	}

	return resources.RoleBindings, nil
}

func (resourceManager *ResourceManager) CreateRoleBinding(namespace string, subject rbacV1.Subject, role string) error {
	roleBinding := &rbacV1.RoleBinding{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      fmt.Sprintf("%s:%s:Role:%s", subject.Kind, subject.Name, role),
			Namespace: namespace,
		},
		Subjects: []rbacV1.Subject{
			subject,
		},
		RoleRef: rbacV1.RoleRef{
			Kind:     "Role",
			Name:     role,
			APIGroup: "rbac.authorization.k8s.io",
		},
	}

	err := resourceManager.Create(roleBinding)

	if err != nil {
		return err
	}

	err = resourceManager.fixNamespaceDefaultRole(namespace, role)

	if err != nil {
		return err
	}

	return resourceManager.resolveSubjectClusterRoleBindings(subject.Kind, subject.Name)
}

func (resourceManager *ResourceManager) DeleteRoleBinding(namespace string, name string) error {
	err := resourceManager.Delete(&rbacV1.RoleBinding{ObjectMeta: metaV1.ObjectMeta{Name: name, Namespace: namespace}})

	if err != nil {
		return err
	}

	// TODO refactor this part
	parts := strings.Split(name, ":")
	return resourceManager.resolveSubjectClusterRoleBindings(parts[0], parts[1])
}

// If a subject still has some roles in kalm namespaces, the user will have `kalm-cluster-resources-reader` cluster role
// Otherwise, the `kalm-cluster-resources-reader` binding will be deleted
func (resourceManager *ResourceManager) resolveSubjectClusterRoleBindings(kind string, name string) (err error) {
	err = resourceManager.fixDefaultClusterRole()

	if err != nil {
		return err
	}

	allRoleBindings, err := resourceManager.ListRoleBindings(AllNamespaces)

	if err != nil {
		return err
	}

	var hasRole bool

	for _, binding := range allRoleBindings {
		if hasRole {
			break
		}

		for _, subject := range binding.Subjects {
			if subject.Kind == kind && name == subject.Name {
				hasRole = true
				break
			}
		}
	}

	clusterRoleBindingName := fmt.Sprintf("%s:%s:kalm-cluster-resources-reader", kind, name)

	if hasRole {
		subject := rbacV1.Subject{
			Kind:     kind,
			APIGroup: "rbac.authorization.k8s.io",
			Name:     name,
		}

		if kind == "ServiceAccount" {
			subject.Namespace = KALM_SYSTEM_NAMESPACE
			subject.APIGroup = ""
		}

		clusterRoleBinding := &rbacV1.ClusterRoleBinding{
			ObjectMeta: metaV1.ObjectMeta{
				Name: clusterRoleBindingName,
			},
			Subjects: []rbacV1.Subject{
				subject,
			},
			RoleRef: rbacV1.RoleRef{
				APIGroup: "rbac.authorization.k8s.io",
				Kind:     "ClusterRole",
				Name:     "kalm-cluster-resources-reader",
			},
		}

		err := resourceManager.Create(clusterRoleBinding)

		if errors.IsAlreadyExists(err) {
			return nil
		}

		return err
	} else {
		return resourceManager.Delete(&rbacV1.ClusterRoleBinding{
			ObjectMeta: metaV1.ObjectMeta{
				Name: clusterRoleBindingName,
			},
		})
	}
}

func (resourceManager *ResourceManager) fixDefaultClusterRole() (err error) {
	clusterRole := &rbacV1.ClusterRole{
		ObjectMeta: metaV1.ObjectMeta{
			Name: "kalm-cluster-resources-reader",
		},
		Rules: []rbacV1.PolicyRule{
			{
				APIGroups: []string{""},
				Resources: []string{"namespaces", "nodes"},
				Verbs:     []string{"get", "list"},
			},
		},
	}

	err = resourceManager.Create(clusterRole)

	if err != nil && errors.IsAlreadyExists(err) {
		return nil
	}

	return err
}

func (resourceManager *ResourceManager) fixNamespaceDefaultRole(namespace string, roleName string) error {

	switch roleName {
	case "reader":
		role := &rbacV1.Role{}
		err := resourceManager.Get(namespace, roleName, role)

		if err != nil {
			if errors.IsNotFound(err) {
				return resourceManager.createReaderRole(namespace)
			} else {
				return err
			}
		}

	case "writer":
		role := &rbacV1.Role{}
		err := resourceManager.Get(namespace, roleName, role)

		if err != nil {
			if errors.IsNotFound(err) {
				return resourceManager.createWriterRole(namespace)
			} else {
				return err
			}
		}
	}

	return nil
}

func (resourceManager *ResourceManager) createReaderRole(namespace string) (err error) {
	role := &rbacV1.Role{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      "reader",
			Namespace: namespace,
		},
		Rules: []rbacV1.PolicyRule{
			{
				Verbs: []string{
					"list", "get", "watch",
				},
				Resources: []string{
					"pods", "events", "configmaps", "services",
				},
				APIGroups: []string{
					"",
				},
			},
			{
				Verbs: []string{
					"get",
				},
				Resources: []string{
					"pods/log",
				},
				APIGroups: []string{
					"",
				},
			},
			{
				Verbs: []string{
					"list", "get", "watch",
				},
				Resources: []string{
					"deployments",
				},
				APIGroups: []string{
					"apps",
				},
			},
			{
				Verbs: []string{
					"list", "get", "watch",
				},
				Resources: []string{
					"applications",
				},
				APIGroups: []string{
					"core.kalm.dev",
				},
			},
		},
	}

	err = resourceManager.Create(role)

	if err != nil {
		return err
	}
	return nil
}

func (resourceManager *ResourceManager) createWriterRole(namespace string) (err error) {
	role := &rbacV1.Role{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      "writer",
			Namespace: namespace,
		},
		Rules: []rbacV1.PolicyRule{
			{
				Verbs: []string{
					"list", "get", "watch", "delete", "update", "create", "patch",
				},
				Resources: []string{
					"pods", "events", "configmaps", "services",
				},
				APIGroups: []string{
					"",
				},
			},
			{
				Verbs: []string{
					"get",
				},
				Resources: []string{
					"pods/log",
				},
				APIGroups: []string{
					"",
				},
			},
			{
				Verbs: []string{
					"create",
				},
				Resources: []string{
					"pods/exec",
				},
				APIGroups: []string{
					"",
				},
			},
			{
				Verbs: []string{
					"list", "get", "watch",
				},
				Resources: []string{
					"deployments",
				},
				APIGroups: []string{
					"apps",
				},
			},
			{
				Verbs: []string{
					"list", "get", "watch", "update", "create", "patch", "delete",
				},
				Resources: []string{
					"applications",
				},
				APIGroups: []string{
					"core.kalm.dev",
				},
			},
		},
	}

	err = resourceManager.Create(role)

	if err != nil {
		return err
	}
	return nil
}

func (resourceManager *ResourceManager) createDefaultKalmRoles(namespace string) (err error) {
	err = resourceManager.createReaderRole(namespace)
	if err != nil {
		return
	}

	err = resourceManager.createWriterRole(namespace)
	if err != nil {
		return
	}
	return nil
}
