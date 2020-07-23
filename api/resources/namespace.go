package resources

import (
	authorizationV1 "k8s.io/api/authorization/v1"
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"strings"
)

const (
	KALM_SYSTEM_NAMESPACE = "kalm-system"
	KALM_NAMESPACE_PREFIX = "kalm-"
)

type NamespaceListChannel struct {
	List  chan []Namespace
	Error chan error
}

type Namespace struct {
	Name  string   `json:"name"`
	Roles []string `json:"roles"`
}

func (builder *Builder) GetNamespaceListChannel() *NamespaceListChannel {
	channel := &NamespaceListChannel{
		List:  make(chan []Namespace, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var nsList coreV1.NamespaceList
		err := builder.List(&nsList)

		if err != nil {
			channel.List <- nil
			channel.Error <- err
			return
		}

		list := make([]Namespace, 0, len(nsList.Items))

		for _, item := range nsList.Items {
			if !strings.HasPrefix(item.Name, KALM_NAMESPACE_PREFIX) {
				continue
			}

			if item.Name == KALM_SYSTEM_NAMESPACE {
				continue
			}

			// TODO is this correct to ignore deleting namespace?
			if item.DeletionTimestamp != nil {
				continue
			}

			roles := make([]string, 0, 2)

			writerReview := &authorizationV1.SelfSubjectAccessReview{
				Spec: authorizationV1.SelfSubjectAccessReviewSpec{
					ResourceAttributes: &authorizationV1.ResourceAttributes{
						Namespace: item.Name,
						Resource:  "applications",
						Verb:      "create",
						Group:     "core.kalm.dev",
					},
				},
			}

			// TODO Is there a better way?
			// Infer user roles with some specific access review. This is not accurate but a trade off.
			err := builder.Create(writerReview)

			if err != nil {
				channel.List <- nil
				channel.Error <- err
				return
			}

			if writerReview.Status.Allowed {
				roles = append(roles, "writer")
			}

			readerReview := &authorizationV1.SelfSubjectAccessReview{
				Spec: authorizationV1.SelfSubjectAccessReviewSpec{
					ResourceAttributes: &authorizationV1.ResourceAttributes{
						Namespace: item.Name,
						Resource:  "applications",
						Verb:      "get",
						Group:     "core.kalm.dev",
					},
				},
			}

			err = builder.Create(readerReview)

			if err != nil {
				channel.List <- nil
				channel.Error <- err
				return
			}

			if readerReview.Status.Allowed {
				roles = append(roles, "reader")
			}

			if len(roles) > 0 {
				list = append(list, Namespace{
					Name:  item.Name,
					Roles: roles,
				})
			}
		}

		channel.List <- list
		channel.Error <- nil
	}()

	return channel
}

func (builder *Builder) ListNamespaces() ([]Namespace, error) {
	resourceChannels := &ResourceChannels{
		NamespaceList: builder.GetNamespaceListChannel(),
	}

	resources, err := resourceChannels.ToResources()

	if err != nil {
		return nil, err
	}

	return resources.Namespaces, nil
}

func (builder *Builder) CreateNamespace(name string) error {
	namespace := &coreV1.Namespace{
		ObjectMeta: metaV1.ObjectMeta{
			Name: formatNamespaceName(name),
		},
	}

	err := builder.Create(namespace)

	if err != nil {
		return err
	}

	return builder.createDefaultKalmRoles(namespace.Name)
}

func (builder *Builder) DeleteNamespace(name string) error {
	return builder.Delete(&coreV1.Namespace{ObjectMeta: metaV1.ObjectMeta{Name: formatNamespaceName(name)}})
}

func formatNamespaceName(name string) string {
	if strings.HasPrefix(name, KALM_NAMESPACE_PREFIX) {
		name = strings.ReplaceAll(name, KALM_NAMESPACE_PREFIX, "")
	}
	return KALM_NAMESPACE_PREFIX + name
}
