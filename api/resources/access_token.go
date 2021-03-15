package resources

import (
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type AccessToken struct {
	Name string `json:"name"`
	*v1alpha1.AccessTokenSpec
}

func (resourceManager *ResourceManager) DeleteAccessToken(name string) error {
	return resourceManager.Delete(
		&v1alpha1.AccessToken{
			ObjectMeta: metaV1.ObjectMeta{
				Name: name,
			},
		},
	)
}

func (resourceManager *ResourceManager) CreateAccessToken(accessToken *AccessToken) (*AccessToken, error) {
	resAccessToken := &v1alpha1.AccessToken{
		ObjectMeta: metaV1.ObjectMeta{
			Name: accessToken.Name,
		},
		Spec: *accessToken.AccessTokenSpec,
	}

	if err := resourceManager.Create(resAccessToken); err != nil {
		return nil, err
	}

	return BuildAccessTokenFromResource(resAccessToken), nil
}

func BuildAccessTokenFromResource(dk *v1alpha1.AccessToken) *AccessToken {
	return &AccessToken{
		Name:            dk.Name,
		AccessTokenSpec: &dk.Spec,
	}
}

func (resourceManager *ResourceManager) GetAccessTokens(listOptions ...client.ListOption) ([]*AccessToken, error) {
	var accessTokenList v1alpha1.AccessTokenList

	if err := resourceManager.List(&accessTokenList, listOptions...); err != nil {
		return nil, err
	}

	rst := make([]*AccessToken, len(accessTokenList.Items))

	for i := range accessTokenList.Items {
		dk := accessTokenList.Items[i]
		rst[i] = BuildAccessTokenFromResource(&dk)
	}

	return rst, nil
}

var AccessTokenTypeLabelKey = "tokenType"
var DeployAccessTokenLabelValue = "deployAccessToken"

func (resourceManager *ResourceManager) GetDeployAccessTokens(listOptions ...client.ListOption) ([]*AccessToken, error) {
	var accessTokenList v1alpha1.AccessTokenList

	if listOptions == nil {
		listOptions = make([]client.ListOption, 0, 1)
	}

	listOptions = append(listOptions, client.MatchingLabels(map[string]string{
		AccessTokenTypeLabelKey: DeployAccessTokenLabelValue,
	}))

	if err := resourceManager.List(&accessTokenList, listOptions...); err != nil {
		return nil, err
	}

	rst := make([]*AccessToken, len(accessTokenList.Items))

	for i := range accessTokenList.Items {
		dk := accessTokenList.Items[i]
		rst[i] = BuildAccessTokenFromResource(&dk)
	}

	return rst, nil
}

func (resourceManager *ResourceManager) CreateDeployAccessToken(accessToken *AccessToken) (*AccessToken, error) {

	resAccessToken := &v1alpha1.AccessToken{
		ObjectMeta: metaV1.ObjectMeta{
			Name: accessToken.Name,
			Labels: map[string]string{
				AccessTokenTypeLabelKey: DeployAccessTokenLabelValue,
			},
		},
		Spec: *accessToken.AccessTokenSpec,
	}

	if err := resourceManager.Create(resAccessToken); err != nil {
		return nil, err
	}

	return BuildAccessTokenFromResource(resAccessToken), nil
}
