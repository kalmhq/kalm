package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/heroku/docker-registry-client/registry"
	"github.com/joho/godotenv"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	appsV1 "k8s.io/api/apps/v1"
	"k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"os"
	"testing"
	"time"
)

type DockerRegistryControllerSuite struct {
	BasicSuite
	registry  *v1alpha1.DockerRegistry
	secret    *v1.Secret
	namespace *v1.Namespace
}

func (suite *DockerRegistryControllerSuite) SetupSuite() {
	// allow this test run from multiple places
	_ = godotenv.Load("../.env")
	_ = godotenv.Load()

	if os.Getenv("KALM_TEST_DOCKER_REGISTRY_PASSWORD") == "" || os.Getenv("KALM_TEST_DOCKER_REGISTRY_USERNAME") == "" {
		suite.T().Skip()
	}

	suite.BasicSuite.SetupSuite()
	suite.SetupKalmEnabledNs("kalm-system")
	suite.ensureNsExists("cert-manager")
}

func (suite *DockerRegistryControllerSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func TestDockerRegistry(t *testing.T) {
	_ = godotenv.Load("../.env")
	_ = godotenv.Load()

	if os.Getenv("KALM_TEST_DOCKER_REGISTRY_PASSWORD") == "" || os.Getenv("KALM_TEST_DOCKER_REGISTRY_USERNAME") == "" {
		t.Skip()
	}

	_, err := registry.New("https://gcr.io", os.Getenv("KALM_TEST_DOCKER_REGISTRY_USERNAME"), os.Getenv("KALM_TEST_DOCKER_REGISTRY_PASSWORD"))

	if err != nil {
		fmt.Print(err.Error())
		t.Fail()
	}

}

func (suite *DockerRegistryControllerSuite) SetupTest() {
	// create registry without authentication secret
	name := randomName()
	registry := &v1alpha1.DockerRegistry{
		ObjectMeta: metaV1.ObjectMeta{
			Name: name,
		},
		Spec: v1alpha1.DockerRegistrySpec{
			Host: "https://gcr.io",
		},
	}

	suite.createDockerRegistry(registry)
	suite.Eventually(func() bool {
		suite.reloadObject(getDockerRegistryNamespacedName(registry), registry)
		return !registry.Status.AuthenticationVerified
	})

	time.Sleep(5 * time.Second)

	secret := v1.Secret{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      GetRegistryAuthenticationName(name),
			Namespace: "kalm-system",
		},
		Data: map[string][]byte{
			"username": []byte(os.Getenv("KALM_TEST_DOCKER_REGISTRY_USERNAME")),
			"password": []byte(os.Getenv("KALM_TEST_DOCKER_REGISTRY_PASSWORD")),
		},
	}
	suite.Nil(suite.K8sClient.Create(context.Background(), &secret))
	suite.Eventually(func() bool {
		suite.reloadObject(getDockerRegistryNamespacedName(registry), registry)
		return registry.Status.AuthenticationVerified
	})

	suite.registry = registry
	suite.secret = &secret

	ns := suite.SetupKalmEnabledNs()
	suite.namespace = &ns
}

func (suite *DockerRegistryControllerSuite) TestDockerRegistrySecret() {
	suite.Eventually(func() bool {
		suite.reloadObject(types.NamespacedName{
			Namespace: suite.secret.Namespace,
			Name:      suite.secret.Name,
		}, suite.secret)

		return len(suite.secret.OwnerReferences) == 1
	})

	// make secret invalid
	suite.reloadObject(getDockerRegistryNamespacedName(suite.registry), suite.registry)
	suite.secret.Data["username"] = []byte("wrong_name")
	suite.updateObject(suite.secret)

	suite.Eventually(func() bool {
		suite.reloadObject(getDockerRegistryNamespacedName(suite.registry), suite.registry)
		return !suite.registry.Status.AuthenticationVerified
	})

	// make the secret valid again
	suite.reloadObject(getDockerRegistryNamespacedName(suite.registry), suite.registry)
	suite.secret.Data["username"] = []byte("_json_key")
	suite.updateObject(suite.secret)

	suite.Eventually(func() bool {
		suite.reloadObject(getDockerRegistryNamespacedName(suite.registry), suite.registry)
		return suite.registry.Status.AuthenticationVerified
	})
}

func (suite *DockerRegistryControllerSuite) TestSecretDistribution() {
	// old ns should has the image pull secret
	var imagePullSecret v1.Secret
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Name:      getImagePullSecretName(suite.registry.Name),
			Namespace: suite.namespace.Name,
		}, &imagePullSecret)

		return err == nil
	})

	var tmp map[string]interface{}
	_ = json.Unmarshal(imagePullSecret.Data[".dockercfg"], &tmp)
	suite.Equal(string(suite.secret.Data["password"]), tmp[suite.registry.Spec.Host].(map[string]interface{})["password"])

	// wait cluster to be stable
	time.Sleep(5 * time.Second)

	// create a new ns, the image should also exist in this ns
	ns := suite.SetupKalmEnabledNs()
	suite.namespace = &ns

	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Name:      getImagePullSecretName(suite.registry.Name),
			Namespace: suite.namespace.Name,
		}, &imagePullSecret)

		return err == nil
	})

	// the image secret should also exist in deployment pod template
	component := generateEmptyComponent(suite.namespace.Name)
	suite.createComponent(component)
	suite.Eventually(func() bool {
		var deployment appsV1.Deployment

		if err := suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Name:      component.Name,
			Namespace: component.Namespace,
		}, &deployment); err != nil {
			return false
		}

		return len(deployment.Spec.Template.Spec.ImagePullSecrets) > 0
	}, "can't get deployment")

	expectedOwnerRef := metaV1.OwnerReference{
		UID: suite.registry.UID,
	}

	// delete the registry
	suite.Nil(suite.K8sClient.Delete(context.Background(), suite.registry))

	// generated image pull secret should also be deleted
	suite.Eventually(func() bool {
		suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Name:      getImagePullSecretName(suite.registry.Name),
			Namespace: suite.namespace.Name,
		}, &imagePullSecret)

		return containsOwnerRef(imagePullSecret.ObjectMeta.OwnerReferences, expectedOwnerRef)
	})
}

func containsOwnerRef(references []metaV1.OwnerReference, target metaV1.OwnerReference) bool {
	for _, ref := range references {
		if ref.UID == target.UID {
			return true
		}
	}

	return false
}

func TestDockerRegistryControllerSuite(t *testing.T) {
	suite.Run(t, new(DockerRegistryControllerSuite))
}
