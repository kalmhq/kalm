package resources

import (
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	"github.com/kapp-staging/kapp/controller/controllers"
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sync"
)

type DockerRegistryListChannel struct {
	List  chan []*v1alpha1.DockerRegistry
	Error chan error
}

func (builder *Builder) GetDockerRegistryListChannel(listOptions metaV1.ListOptions) *DockerRegistryListChannel {
	channel := &DockerRegistryListChannel{
		List:  make(chan []*v1alpha1.DockerRegistry, 1),
		Error: make(chan error, 1),
	}

	go func() {

		var fetched v1alpha1.DockerRegistryList
		err := builder.List(&fetched)

		if err != nil {
			channel.List <- nil
			channel.Error <- err
			return
		}

		res := make([]*v1alpha1.DockerRegistry, len(fetched.Items))

		for i, registry := range fetched.Items {
			res[i] = &registry
		}

		channel.List <- res
		channel.Error <- err
	}()

	return channel
}

type DockerRegistry struct {
	*v1alpha1.DockerRegistrySpec   `json:",inline"`
	*v1alpha1.DockerRegistryStatus `json:",inline"`
	Name                           string `json:"name"`
	Username                       string `json:"username"`
	Password                       string `json:"password"`
}

func (builder *Builder) GetDockerRegistry(name string) (*DockerRegistry, error) {
	var registry v1alpha1.DockerRegistry
	var secret coreV1.Secret
	var err error

	wg := sync.WaitGroup{}
	wg.Add(1)
	go func() {
		defer wg.Done()
		err = builder.Get("", name, &registry)
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		secretName := controllers.GetRegistryAuthenticationName(name)
		err = builder.Get("kapp-system", secretName, &secret)
	}()

	wg.Wait()

	if err != nil {
		return nil, err
	}

	return buildDockerRegistryFromResource(&registry, &secret), nil
}

func (builder *Builder) GetDockerRegistries() ([]*DockerRegistry, error) {
	resourceChannels := &ResourceChannels{
		DockerRegistryList: builder.GetDockerRegistryListChannel(ListAll),
		SecretList:         builder.GetSecretListChannel("kapp-system", client.MatchingLabels{"kapp-docker-registry-authentication": "true"}),
	}

	resources, err := resourceChannels.ToResources()

	if err != nil {
		return nil, err
	}

	res := make([]*DockerRegistry, len(resources.DockerRegistries))
	secretMap := make(map[string]*coreV1.Secret)

	for i := range resources.Secrets {
		secret := resources.Secrets[i]
		secretMap[secret.Name] = secret
	}

	for i := range resources.DockerRegistries {
		registry := resources.DockerRegistries[i]
		secret := secretMap[controllers.GetRegistryAuthenticationName(registry.Name)]
		res[i] = buildDockerRegistryFromResource(registry, secret)
	}

	return res, nil
}

func buildDockerRegistryFromResource(registry *v1alpha1.DockerRegistry, secret *coreV1.Secret) *DockerRegistry {
	var username, password string

	if secret != nil {
		username = string(secret.Data["username"])
		password = string(secret.Data["password"])
	}

	return &DockerRegistry{
		DockerRegistrySpec:   &registry.Spec,
		DockerRegistryStatus: &registry.Status,
		Name:                 registry.Name,
		Username:             username,
		Password:             password,
	}
}

func (builder *Builder) CreateDockerRegistry(registry *DockerRegistry) (*DockerRegistry, error) {
	dockerRegistry := &v1alpha1.DockerRegistry{
		ObjectMeta: metaV1.ObjectMeta{
			Name: registry.Name,
		},
		Spec: *registry.DockerRegistrySpec,
	}

	secret := &coreV1.Secret{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      controllers.GetRegistryAuthenticationName(registry.Name),
			Namespace: "kapp-system",
		},
		Data: map[string][]byte{
			"username": []byte(registry.Username),
			"password": []byte(registry.Password),
		},
	}

	var err error
	wg := sync.WaitGroup{}
	wg.Add(2)

	go func() {
		defer wg.Done()
		err = builder.Create(dockerRegistry)
	}()

	go func() {
		defer wg.Done()
		err = builder.Create(secret)
	}()

	wg.Wait()

	if err != nil {
		return nil, err
	}

	return buildDockerRegistryFromResource(dockerRegistry, secret), nil
}

func (builder *Builder) UpdateDockerRegistry(registry *DockerRegistry) (*DockerRegistry, error) {
	dockerRegistry := &v1alpha1.DockerRegistry{}
	secret := &coreV1.Secret{}

	var err error

	wg := sync.WaitGroup{}
	wg.Add(2)

	go func() {
		defer wg.Done()
		err = builder.Get("", registry.Name, dockerRegistry)
	}()

	go func() {
		defer wg.Done()
		err = builder.Get("kapp-system", controllers.GetRegistryAuthenticationName(registry.Name), secret)
	}()

	wg.Wait()

	if err != nil {
		return nil, err
	}

	secret.Data = map[string][]byte{
		"username": []byte(registry.Username),
		"password": []byte(registry.Password),
	}
	dockerRegistry.Spec = *registry.DockerRegistrySpec

	wg.Add(2)

	go func() {
		defer wg.Done()
		err = builder.Update(dockerRegistry)
	}()

	go func() {
		defer wg.Done()
		err = builder.Update(secret)
	}()

	wg.Wait()

	return buildDockerRegistryFromResource(dockerRegistry, secret), nil
}

func (builder *Builder) DeleteDockerRegistry(name string) error {
	return builder.Delete(&v1alpha1.DockerRegistry{ObjectMeta: metaV1.ObjectMeta{Name: name}})
}
