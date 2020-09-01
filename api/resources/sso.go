package resources

import (
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/kalmhq/kalm/controller/controllers"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type SSOConfigListChannel struct {
	List  chan []*v1alpha1.SingleSignOnConfig
	Error chan error
}

type ProtectedEndpointsChannel struct {
	List  chan []v1alpha1.ProtectedEndpoint
	Error chan error
}

const SSO_NAME = "sso"

func (resourceManager *ResourceManager) GetSSOConfigListChannel(listOptions ...client.ListOption) *SSOConfigListChannel {
	channel := &SSOConfigListChannel{
		List:  make(chan []*v1alpha1.SingleSignOnConfig, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var fetched v1alpha1.SingleSignOnConfigList
		err := resourceManager.List(&fetched, listOptions...)

		if err != nil {
			channel.List <- nil
			channel.Error <- err
			return
		}

		res := make([]*v1alpha1.SingleSignOnConfig, len(fetched.Items))

		for i, ssoConfig := range fetched.Items {
			res[i] = &ssoConfig
		}

		channel.List <- res
		channel.Error <- err
	}()

	return channel
}

func (resourceManager *ResourceManager) GetProtectedEndpointsChannel(listOptions ...client.ListOption) *ProtectedEndpointsChannel {
	channel := &ProtectedEndpointsChannel{
		List:  make(chan []v1alpha1.ProtectedEndpoint, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var fetched v1alpha1.ProtectedEndpointList
		err := resourceManager.List(&fetched, listOptions...)

		if err != nil {
			channel.List <- nil
			channel.Error <- err
			return
		}

		res := make([]v1alpha1.ProtectedEndpoint, len(fetched.Items))

		for i, item := range fetched.Items {
			res[i] = item
		}

		channel.List <- res
		channel.Error <- nil
	}()

	return channel
}

type ProtectedEndpoint struct {
	Name                        string   `json:"name"`
	Namespace                   string   `json:"namespace"`
	EndpointName                string   `json:"endpointName"`
	Ports                       []uint32 `json:"ports"`
	Groups                      []string `json:"groups"`
	AllowToPassIfHasBearerToken bool     `json:"allowToPassIfHasBearerToken,omitempty"`
}

type SSOConfig struct {
	*v1alpha1.SingleSignOnConfigSpec `json:",inline"`
}

func (resourceManager *ResourceManager) GetSSOConfig() (*SSOConfig, error) {
	var ssoConfig v1alpha1.SingleSignOnConfig

	if err := resourceManager.Get(controllers.KALM_DEX_NAMESPACE, SSO_NAME, &ssoConfig); err != nil {
		return nil, client.IgnoreNotFound(err)
	}

	return BuildSSOConfigFromResource(&ssoConfig), nil
}

func BuildSSOConfigFromResource(ssoConfig *v1alpha1.SingleSignOnConfig) *SSOConfig {
	return &SSOConfig{
		&ssoConfig.Spec,
	}
}

func (resourceManager *ResourceManager) CreateSSOConfig(ssoConfig *SSOConfig) (*SSOConfig, error) {
	sso := &v1alpha1.SingleSignOnConfig{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      SSO_NAME,
			Namespace: controllers.KALM_DEX_NAMESPACE,
		},
		Spec: *ssoConfig.SingleSignOnConfigSpec,
	}

	if err := resourceManager.Create(sso); err != nil {
		return nil, err
	}

	return BuildSSOConfigFromResource(sso), nil
}

func (resourceManager *ResourceManager) UpdateSSOConfig(ssoConfig *SSOConfig) (*SSOConfig, error) {
	sso := &v1alpha1.SingleSignOnConfig{}

	if err := resourceManager.Get(controllers.KALM_DEX_NAMESPACE, SSO_NAME, sso); err != nil {
		return nil, err
	}

	sso.Spec = *ssoConfig.SingleSignOnConfigSpec

	if err := resourceManager.Update(sso); err != nil {
		return nil, err
	}

	return BuildSSOConfigFromResource(sso), nil
}

func (resourceManager *ResourceManager) DeleteSSOConfig() error {
	return resourceManager.Delete(&v1alpha1.SingleSignOnConfig{ObjectMeta: metaV1.ObjectMeta{Name: SSO_NAME, Namespace: controllers.KALM_DEX_NAMESPACE}})
}

func ProtectedEndpointCRDToProtectedEndpoint(endpoint *v1alpha1.ProtectedEndpoint) *ProtectedEndpoint {
	ep := &ProtectedEndpoint{
		Name:                        endpoint.Name,
		Namespace:                   endpoint.Namespace,
		EndpointName:                endpoint.Spec.EndpointName,
		Ports:                       endpoint.Spec.Ports,
		Groups:                      endpoint.Spec.Groups,
		AllowToPassIfHasBearerToken: endpoint.Spec.AllowToPassIfHasBearerToken,
	}

	// import for frontend
	if ep.Ports == nil {
		ep.Ports = []uint32{}
	}

	if ep.Groups == nil {
		ep.Groups = []string{}
	}

	return ep
}

func (resourceManager *ResourceManager) ListProtectedEndpoints() ([]*ProtectedEndpoint, error) {
	channel := ResourceChannels{
		ProtectedEndpoint: resourceManager.GetProtectedEndpointsChannel(),
	}

	resources, err := channel.ToResources()

	if err != nil {
		return nil, err
	}

	res := make([]*ProtectedEndpoint, len(resources.ProtectedEndpoint))

	for i := range resources.ProtectedEndpoint {
		res[i] = ProtectedEndpointCRDToProtectedEndpoint(&resources.ProtectedEndpoint[i])
	}

	return res, nil
}

func getProtectedEndpointCRDNameFromEndpointName(endpointName string) string {
	return "component-" + endpointName
}

func (resourceManager *ResourceManager) CreateProtectedEndpoint(ep *ProtectedEndpoint) (*ProtectedEndpoint, error) {
	endpoint := &v1alpha1.ProtectedEndpoint{
		ObjectMeta: metaV1.ObjectMeta{
			Namespace: ep.Namespace,
			Name:      getProtectedEndpointCRDNameFromEndpointName(ep.EndpointName),
		},
		Spec: v1alpha1.ProtectedEndpointSpec{
			EndpointName:                ep.EndpointName,
			Ports:                       ep.Ports,
			Groups:                      ep.Groups,
			AllowToPassIfHasBearerToken: ep.AllowToPassIfHasBearerToken,
		},
	}

	err := resourceManager.Create(endpoint)

	if err != nil {
		return nil, err
	}

	return ProtectedEndpointCRDToProtectedEndpoint(endpoint), nil
}

func (resourceManager *ResourceManager) UpdateProtectedEndpoint(ep *ProtectedEndpoint) (*ProtectedEndpoint, error) {
	endpoint := &v1alpha1.ProtectedEndpoint{
		TypeMeta: metaV1.TypeMeta{
			Kind:       "ProtectedEndpoint",
			APIVersion: "core.kalm.dev/v1alpha1",
		},
		ObjectMeta: metaV1.ObjectMeta{
			Namespace: ep.Namespace,
			Name:      getProtectedEndpointCRDNameFromEndpointName(ep.EndpointName),
		},
		Spec: v1alpha1.ProtectedEndpointSpec{
			EndpointName:                ep.EndpointName,
			Ports:                       ep.Ports,
			Groups:                      ep.Groups,
			AllowToPassIfHasBearerToken: ep.AllowToPassIfHasBearerToken,
		},
	}

	err := resourceManager.Apply(endpoint)

	if err != nil {
		return nil, err
	}

	return ProtectedEndpointCRDToProtectedEndpoint(endpoint), nil
}

func (resourceManager *ResourceManager) DeleteProtectedEndpoints(ep *ProtectedEndpoint) error {
	endpoint := &v1alpha1.ProtectedEndpoint{
		ObjectMeta: metaV1.ObjectMeta{
			Namespace: ep.Namespace,
			Name:      getProtectedEndpointCRDNameFromEndpointName(ep.EndpointName),
		},
	}

	return resourceManager.Delete(endpoint)
}
