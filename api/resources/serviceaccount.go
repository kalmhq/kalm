package resources

import (
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (resourceManager *ResourceManager) CreateKalmServiceAccount(name string) error {
	resourceManager.Create(&coreV1.Namespace{
		ObjectMeta: metaV1.ObjectMeta{
			Name: KALM_SYSTEM_NAMESPACE,
		},
	})

	err := resourceManager.Create(&coreV1.ServiceAccount{
		ObjectMeta: metaV1.ObjectMeta{
			Namespace: KALM_SYSTEM_NAMESPACE,
			Name:      name,
		},
	})

	return err
}

func (resourceManager *ResourceManager) GetServiceAccountSecrets(serviceAccountName string) ([]byte, []byte, error) {
	serviceaccount := &coreV1.ServiceAccount{}
	err := resourceManager.Get(KALM_SYSTEM_NAMESPACE, serviceAccountName, serviceaccount)

	if err != nil {
		return nil, nil, err
	}

	secret := &coreV1.Secret{}
	err = resourceManager.Get(KALM_SYSTEM_NAMESPACE, serviceaccount.Secrets[0].Name, secret)

	if err != nil {
		return nil, nil, err
	}

	return secret.Data["token"], secret.Data["ca.crt"], nil
}
