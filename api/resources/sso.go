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

const SSO_NAME = "sso"

func (builder *Builder) GetSSOConfigListChannel(listOptions ...client.ListOption) *SSOConfigListChannel {
	channel := &SSOConfigListChannel{
		List:  make(chan []*v1alpha1.SingleSignOnConfig, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var fetched v1alpha1.SingleSignOnConfigList
		err := builder.List(&fetched, listOptions...)

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

type SSOConfig struct {
	*v1alpha1.SingleSignOnConfigSpec `json:",inline"`
}

func (builder *Builder) GetSSOConfig() (*SSOConfig, error) {
	var ssoConfig v1alpha1.SingleSignOnConfig

	if err := builder.Get(controllers.KALM_DEX_NAMESPACE, SSO_NAME, &ssoConfig); err != nil {
		return nil, client.IgnoreNotFound(err)
	}

	return BuildSSOConfigFromResource(&ssoConfig), nil
}

func BuildSSOConfigFromResource(ssoConfig *v1alpha1.SingleSignOnConfig) *SSOConfig {
	return &SSOConfig{
		&ssoConfig.Spec,
	}
}

func (builder *Builder) CreateSSOConfig(ssoConfig *SSOConfig) (*SSOConfig, error) {
	sso := &v1alpha1.SingleSignOnConfig{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      SSO_NAME,
			Namespace: controllers.KALM_DEX_NAMESPACE,
		},
		Spec: *ssoConfig.SingleSignOnConfigSpec,
	}

	if err := builder.Create(sso); err != nil {
		return nil, err
	}

	return BuildSSOConfigFromResource(sso), nil
}

func (builder *Builder) UpdateSSOConfig(ssoConfig *SSOConfig) (*SSOConfig, error) {
	sso := &v1alpha1.SingleSignOnConfig{}

	if err := builder.Get(controllers.KALM_DEX_NAMESPACE, SSO_NAME, sso); err != nil {
		return nil, err
	}

	sso.Spec = *ssoConfig.SingleSignOnConfigSpec

	if err := builder.Update(sso); err != nil {
		return nil, err
	}

	return BuildSSOConfigFromResource(sso), nil
}

func (builder *Builder) DeleteSSOConfig() error {
	return builder.Delete(&v1alpha1.SingleSignOnConfig{ObjectMeta: metaV1.ObjectMeta{Name: SSO_NAME, Namespace: controllers.KALM_DEX_NAMESPACE}})
}
