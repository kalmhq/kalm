package resources

import (
	authorizationV1 "k8s.io/api/authorization/v1"
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"strings"
)

const (
	KAPP_SYSTEM_NAMESPACE = "kapp-system"
	KAPP_NAMESPACE_PREFIX = "kapp-"
)

type NamespaceListChannel struct {
	List  chan []Namespace
	Error chan error
}

type Namespace struct {
	Name  string   `json:"name"`
	Roles []string `json:"roles"`
}

func getNamespaceListChannel(k8sClient *kubernetes.Clientset, listOptions metaV1.ListOptions) *NamespaceListChannel {
	channel := &NamespaceListChannel{
		List:  make(chan []Namespace, 1),
		Error: make(chan error, 1),
	}

	go func() {
		res, err := k8sClient.CoreV1().Namespaces().List(listOptions)

		if err != nil {
			channel.List <- nil
			channel.Error <- err
			return
		}

		list := make([]Namespace, 0, len(res.Items))

		for _, item := range res.Items {
			if !strings.HasPrefix(item.Name, KAPP_NAMESPACE_PREFIX) {
				continue
			}

			if item.Name == KAPP_SYSTEM_NAMESPACE {
				continue
			}

			// TODO is this correct to ignore deleting namespace?
			if item.DeletionTimestamp != nil {
				continue
			}

			roles := make([]string, 0, 2)

			// TODO Is there a better way?
			// Infer user roles with some specific access review. This is not accurate but a trade off.
			writerReview, err := k8sClient.AuthorizationV1().SelfSubjectAccessReviews().Create(&authorizationV1.SelfSubjectAccessReview{
				Spec: authorizationV1.SelfSubjectAccessReviewSpec{
					ResourceAttributes: &authorizationV1.ResourceAttributes{
						Namespace: item.Name,
						Resource:  "applications",
						Verb:      "create",
						Group:     "core.kapp.dev",
					},
				},
			})

			if err != nil {
				channel.List <- nil
				channel.Error <- err
				return
			}

			if writerReview.Status.Allowed {
				roles = append(roles, "writer")
			}

			readerReview, err := k8sClient.AuthorizationV1().SelfSubjectAccessReviews().Create(&authorizationV1.SelfSubjectAccessReview{
				Spec: authorizationV1.SelfSubjectAccessReviewSpec{
					ResourceAttributes: &authorizationV1.ResourceAttributes{
						Namespace: item.Name,
						Resource:  "applications",
						Verb:      "get",
						Group:     "core.kapp.dev",
					},
				},
			})

			if err != nil {
				channel.List <- nil
				channel.Error <- err
				return
			}

			if readerReview.Status.Allowed {
				roles = append(roles, "reader")
			}

			list = append(list, Namespace{
				Name:  item.Name,
				Roles: roles,
			})
		}

		channel.List <- list
		channel.Error <- nil
	}()

	return channel
}

func ListNamespaces(k8sClient *kubernetes.Clientset) ([]Namespace, error) {
	resourceChannels := &ResourceChannels{
		NamespaceList: getNamespaceListChannel(k8sClient, ListAll),
	}

	resources, err := resourceChannels.ToResources()

	if err != nil {
		return nil, err
	}

	return resources.Namespaces, nil
}

func CreateNamespace(k8sClient *kubernetes.Clientset, name string) error {
	namespace := &coreV1.Namespace{
		ObjectMeta: metaV1.ObjectMeta{
			Name: formatNamespaceName(name),
		},
	}

	_, err := k8sClient.CoreV1().Namespaces().Create(namespace)

	if err != nil {
		return err
	}

	return createDefaultKappRoles(k8sClient, namespace.Name)
}

func DeleteNamespace(k8sClient *kubernetes.Clientset, name string) error {
	return k8sClient.CoreV1().Namespaces().Delete(formatNamespaceName(name), nil)
}

func formatNamespaceName(name string) string {
	if strings.HasPrefix(name, KAPP_NAMESPACE_PREFIX) {
		name = strings.ReplaceAll(name, KAPP_NAMESPACE_PREFIX, "")
	}
	return KAPP_NAMESPACE_PREFIX + name
}
