package resources

import (
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

func CreateKalmServiceAccount(k8sClient *kubernetes.Clientset, name string) error {
	k8sClient.CoreV1().Namespaces().Create(&coreV1.Namespace{
		ObjectMeta: metaV1.ObjectMeta{
			Name: KALM_SYSTEM_NAMESPACE,
		},
	})

	_, err := k8sClient.CoreV1().ServiceAccounts(KALM_SYSTEM_NAMESPACE).Create(&coreV1.ServiceAccount{
		ObjectMeta: metaV1.ObjectMeta{
			Namespace: KALM_SYSTEM_NAMESPACE,
			Name:      name,
		},
	})

	return err
}

func GetServiceAccountSecrets(k8sClient *kubernetes.Clientset, serviceAccountName string) ([]byte, []byte, error) {
	serviceaccount, err := k8sClient.CoreV1().ServiceAccounts(KALM_SYSTEM_NAMESPACE).Get(serviceAccountName, metaV1.GetOptions{})

	if err != nil {
		return nil, nil, err
	}

	secret, err := k8sClient.CoreV1().Secrets(KALM_SYSTEM_NAMESPACE).Get(serviceaccount.Secrets[0].Name, metaV1.GetOptions{})

	if err != nil {
		return nil, nil, err
	}

	return secret.Data["token"], secret.Data["ca.crt"], nil
}
