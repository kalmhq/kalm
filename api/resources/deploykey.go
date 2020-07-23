package resources

import (
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type DeployKey struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	*v1alpha1.DeployKeySpec
}

func (builder *Builder) DeleteDeployKey(ns, name string) error {
	return builder.Delete(
		&v1alpha1.DeployKey{
			ObjectMeta: metaV1.ObjectMeta{
				Namespace: ns,
				Name:      name,
			},
		},
	)
}

func (builder *Builder) CreateDeployKey(deployKey DeployKey) (DeployKey, error) {
	resDeployKey := v1alpha1.DeployKey{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      deployKey.Name,
			Namespace: deployKey.Namespace,
		},
		Spec: *deployKey.DeployKeySpec,
	}

	if err := builder.Create(&resDeployKey); err != nil {
		return DeployKey{}, err
	}

	return BuildDeployKeyFromResource(resDeployKey), nil
}

func BuildDeployKeyFromResource(dk v1alpha1.DeployKey) DeployKey {
	return DeployKey{
		Namespace:     dk.Namespace,
		Name:          dk.Name,
		DeployKeySpec: &dk.Spec,
	}
}

func (builder *Builder) GetDeployKeys(ns string) ([]DeployKey, error) {
	var dkList v1alpha1.DeployKeyList

	if err := builder.List(&dkList, client.InNamespace(ns)); err != nil {
		return nil, err
	}

	var rst []DeployKey
	for _, dk := range dkList.Items {
		rst = append(rst, BuildDeployKeyFromResource(dk))
	}

	return rst, nil
}
