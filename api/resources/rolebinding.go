package resources

import (
	"fmt"
	rbacV1 "k8s.io/api/rbac/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"strings"
)

type RoleBindingListChannel struct {
	List  chan []rbacV1.RoleBinding
	Error chan error
}

func getRoleBindingListChannel(k8sClient *kubernetes.Clientset, namespace string, listOptions metaV1.ListOptions) *RoleBindingListChannel {
	channel := &RoleBindingListChannel{
		List:  make(chan []rbacV1.RoleBinding, 1),
		Error: make(chan error, 1),
	}

	go func() {
		res, err := k8sClient.RbacV1().RoleBindings(namespace).List(listOptions)

		if err != nil {
			channel.List <- nil
			channel.Error <- err
			return
		}

		list := make([]rbacV1.RoleBinding, 0, len(res.Items))

		for _, item := range res.Items {
			if !strings.HasPrefix(item.Namespace, KAPP_NAMESPACE_PREFIX) {
				continue
			}

			if item.Namespace == KAPP_SYSTEM_NAMESPACE {
				continue
			}

			list = append(list, item)
		}

		channel.List <- list
		channel.Error <- nil
	}()

	return channel
}

func ListRoleBindings(k8sClient *kubernetes.Clientset, namespace string) ([]rbacV1.RoleBinding, error) {
	resourceChannels := &ResourceChannels{
		RoleBindingList: getRoleBindingListChannel(k8sClient, namespace, ListAll),
	}

	resources, err := resourceChannels.ToResources()

	if err != nil {
		return nil, err
	}

	return resources.RoleBindings, nil
}

func CreateRoleBinding(k8sClient *kubernetes.Clientset, namespace string, subject rbacV1.Subject, role string) error {
	_, err := k8sClient.RbacV1().RoleBindings(namespace).Create(&rbacV1.RoleBinding{
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
	})

	if err != nil {
		return err
	}

	err = fixNamespaceDefaultRole(k8sClient, namespace, role)

	if err != nil {
		return err
	}

	return resolveSubjectClusterRoleBindings(k8sClient, subject.Kind, subject.Name)
}

func DeleteRoleBinding(k8sClient *kubernetes.Clientset, namespace string, name string) error {
	err := k8sClient.RbacV1().RoleBindings(namespace).Delete(name, nil)

	if err != nil {
		return err
	}

	// TODO refactor this part
	parts := strings.Split(name, ":")
	return resolveSubjectClusterRoleBindings(k8sClient, parts[0], parts[1])
}

// If a subject still has some roles in kalm namespaces, the user will have `kalm-cluster-resources-reader` cluster role
// Otherwise, the `kalm-cluster-resources-reader` binding will be deleted
func resolveSubjectClusterRoleBindings(k8sClient *kubernetes.Clientset, kind string, name string) (err error) {
	err = fixDefaultClusterRole(k8sClient)

	if err != nil {
		return err
	}

	allRoleBindings, err := ListRoleBindings(k8sClient, AllNamespaces)

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
			subject.Namespace = KAPP_SYSTEM_NAMESPACE
			subject.APIGroup = ""
		}

		_, err := k8sClient.RbacV1().ClusterRoleBindings().Create(&rbacV1.ClusterRoleBinding{
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
		})

		if errors.IsAlreadyExists(err) {
			return nil
		}

		return err
	} else {
		return k8sClient.RbacV1().ClusterRoleBindings().Delete(clusterRoleBindingName, nil)
	}
}

func fixDefaultClusterRole(k8sClient *kubernetes.Clientset) (err error) {
	_, err = k8sClient.RbacV1().ClusterRoles().Create(&rbacV1.ClusterRole{
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
	})

	if err != nil && errors.IsAlreadyExists(err) {
		return nil
	}

	return err
}

func fixNamespaceDefaultRole(k8sClient *kubernetes.Clientset, namespace string, roleName string) error {

	switch roleName {
	case "reader":
		_, err := k8sClient.RbacV1().Roles(namespace).Get(roleName, metaV1.GetOptions{})

		if err != nil {
			if errors.IsNotFound(err) {
				return createReaderRole(k8sClient, namespace)
			} else {
				return err
			}
		}

	case "writer":
		_, err := k8sClient.RbacV1().Roles(namespace).Get(roleName, metaV1.GetOptions{})

		if err != nil {
			if errors.IsNotFound(err) {
				return createWriterRole(k8sClient, namespace)
			} else {
				return err
			}
		}
	}

	return nil
}

func createReaderRole(k8sClient *kubernetes.Clientset, namespace string) (err error) {
	_, err = k8sClient.RbacV1().Roles(namespace).Create(&rbacV1.Role{
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
	})

	if err != nil {
		return err
	}
	return nil
}

func createWriterRole(k8sClient *kubernetes.Clientset, namespace string) (err error) {
	_, err = k8sClient.RbacV1().Roles(namespace).Create(&rbacV1.Role{
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
	})

	if err != nil {
		return err
	}
	return nil
}

func createDefaultKalmRoles(k8sClient *kubernetes.Clientset, namespace string) (err error) {
	err = createReaderRole(k8sClient, namespace)
	if err != nil {
		return
	}

	err = createWriterRole(k8sClient, namespace)
	if err != nil {
		return
	}
	return nil
}
