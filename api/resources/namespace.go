package resources

import (
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
	List  chan []coreV1.Namespace
	Error chan error
}

func getNamespaceListChannel(k8sClient *kubernetes.Clientset, listOptions metaV1.ListOptions) *NamespaceListChannel {
	channel := &NamespaceListChannel{
		List:  make(chan []coreV1.Namespace, 1),
		Error: make(chan error, 1),
	}

	go func() {
		res, err := k8sClient.CoreV1().Namespaces().List(listOptions)

		if err != nil {
			channel.List <- nil
			channel.Error <- err
			return
		}

		list := make([]coreV1.Namespace, 0, len(res.Items))

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

			list = append(list, item)
		}

		channel.List <- list
		channel.Error <- nil
	}()

	return channel
}

func ListNamespaces(k8sClient *kubernetes.Clientset) ([]coreV1.Namespace, error) {
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
