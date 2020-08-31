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

func (builder *Builder) DeleteAccessToken(name string) error {
	return builder.Delete(
		&v1alpha1.AccessToken{
			ObjectMeta: metaV1.ObjectMeta{
				Name: name,
			},
		},
	)
}

func (builder *Builder) CreateAccessToken(accessToken *AccessToken) (*AccessToken, error) {
	resAccessToken := &v1alpha1.AccessToken{
		ObjectMeta: metaV1.ObjectMeta{
			Name: accessToken.Name,
		},
		Spec: *accessToken.AccessTokenSpec,
	}

	if err := builder.Create(resAccessToken); err != nil {
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

func (builder *Builder) GetAccessTokenByToken(token string) (*v1alpha1.AccessToken, error) {
	name := v1alpha1.GetAccessTokenNameFromToken(token)
	var accessToken v1alpha1.AccessToken
	if err := builder.Get("", name, &accessToken); err != nil {
		return nil, err
	}
	return &accessToken, nil
}

func (builder *Builder) GetAccessTokens(ns string) ([]*AccessToken, error) {
	var accessTokenList v1alpha1.AccessTokenList

	if err := builder.List(&accessTokenList, client.InNamespace(ns)); err != nil {
		return nil, err
	}

	rst := make([]*AccessToken, len(accessTokenList.Items))
	for i := range accessTokenList.Items {
		dk := accessTokenList.Items[i]
		rst[i] = BuildAccessTokenFromResource(&dk)
	}

	return rst, nil
}
