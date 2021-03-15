package resources

import (
	"sync"

	"k8s.io/apimachinery/pkg/api/errors"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/kalmhq/kalm/controller/controllers"
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type DockerRegistryListChannel struct {
	List  chan []v1alpha1.DockerRegistry
	Error chan error
}

func (resourceManager *ResourceManager) GetDockerRegistryListChannel(options ...client.ListOption) *DockerRegistryListChannel {
	channel := &DockerRegistryListChannel{
		List:  make(chan []v1alpha1.DockerRegistry, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var fetched v1alpha1.DockerRegistryList
		err := resourceManager.List(&fetched, options...)

		if err != nil {
			channel.List <- nil
			channel.Error <- err
			return
		}

		res := make([]v1alpha1.DockerRegistry, len(fetched.Items))

		for i, registry := range fetched.Items {
			res[i] = registry
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

func (resourceManager *ResourceManager) GetDockerRegistry(name string) (*DockerRegistry, error) {
	var registry v1alpha1.DockerRegistry
	var secret coreV1.Secret
	var err error

	wg := sync.WaitGroup{}
	wg.Add(1)
	go func() {
		defer wg.Done()
		err = resourceManager.Get("", name, &registry)
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		secretName := controllers.GetRegistryAuthenticationName(name)
		err = resourceManager.Get("kalm-system", secretName, &secret)
	}()

	wg.Wait()

	if err != nil {
		return nil, err
	}

	return FromCRDRegistry(&registry, &secret), nil
}

func (resourceManager *ResourceManager) GetDockerRegistries(options ...client.ListOption) ([]*DockerRegistry, error) {
	resourceChannels := &ResourceChannels{
		DockerRegistryList: resourceManager.GetDockerRegistryListChannel(options...),
		// TODO: add options
		SecretList: resourceManager.GetSecretListChannel(client.InNamespace("kalm-system"), client.MatchingLabels{"kalm-docker-registry-authentication": "true"}),
	}

	resources, err := resourceChannels.ToResources()

	if err != nil {
		return nil, err
	}

	res := make([]*DockerRegistry, len(resources.DockerRegistries))
	secretMap := make(map[string]coreV1.Secret)

	for i := range resources.Secrets {
		secret := resources.Secrets[i]
		secretMap[secret.Name] = secret
	}

	for i := range resources.DockerRegistries {
		registry := resources.DockerRegistries[i]

		secret := secretMap[controllers.GetRegistryAuthenticationName(registry.Name)]
		res[i] = FromCRDRegistry(&registry, &secret)
	}

	return res, nil
}

func FromCRDRegistry(registry *v1alpha1.DockerRegistry, secret *coreV1.Secret) *DockerRegistry {
	var username string

	if secret != nil {
		username = string(secret.Data["username"])
	}

	return &DockerRegistry{
		DockerRegistrySpec:   &registry.Spec,
		DockerRegistryStatus: &registry.Status,
		Name:                 registry.Name,
		Username:             username,
		Password:             "", // do not pass password to client
	}
}

func (resourceManager *ResourceManager) CreateDockerRegistry(registry *DockerRegistry) (*DockerRegistry, error) {
	dockerRegistry := &v1alpha1.DockerRegistry{
		ObjectMeta: metaV1.ObjectMeta{
			Name: registry.Name,
		},
	}

	if registry.DockerRegistrySpec != nil {
		dockerRegistry.Spec = *registry.DockerRegistrySpec
	}

	secret := &coreV1.Secret{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      controllers.GetRegistryAuthenticationName(registry.Name),
			Namespace: "kalm-system",
			Labels: map[string]string{
				"kalm-docker-registry-authentication": "true",
			},
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
		err = resourceManager.Create(dockerRegistry)
	}()

	go func() {
		defer wg.Done()
		err = resourceManager.Create(secret)
	}()

	wg.Wait()

	if err != nil {
		return nil, err
	}

	return FromCRDRegistry(dockerRegistry, secret), nil
}

func (resourceManager *ResourceManager) UpdateDockerRegistry(registry *DockerRegistry) (*DockerRegistry, error) {
	dockerRegistry := &v1alpha1.DockerRegistry{}
	secret := &coreV1.Secret{}

	if err := resourceManager.Get("", registry.Name, dockerRegistry); err != nil {
		return nil, err
	}

	secretName := controllers.GetRegistryAuthenticationName(registry.Name)

	secretNotExist := false

	if err := resourceManager.Get("kalm-system", secretName, secret); err != nil {
		if errors.IsNotFound(err) {
			secretNotExist = true
		} else {
			return nil, err
		}
	}

	secret.Data = map[string][]byte{
		"username": []byte(registry.Username),
		"password": []byte(registry.Password),
	}

	if registry.DockerRegistrySpec != nil {
		dockerRegistry.Spec = *registry.DockerRegistrySpec
	}

	if err := resourceManager.Update(dockerRegistry); err != nil {
		return nil, err
	}

	if secretNotExist {
		secret.Namespace = "kalm-system"
		secret.Name = secretName
		if err := resourceManager.Create(secret); err != nil {
			return nil, err
		}
	} else {
		if err := resourceManager.Update(secret); err != nil {
			return nil, err
		}
	}

	return FromCRDRegistry(dockerRegistry, secret), nil
}

func (resourceManager *ResourceManager) DeleteDockerRegistry(name string) error {
	return resourceManager.Delete(&v1alpha1.DockerRegistry{ObjectMeta: metaV1.ObjectMeta{Name: name}})
}
