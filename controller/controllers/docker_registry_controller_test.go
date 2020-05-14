package controllers

import (
	"context"
	"github.com/joho/godotenv"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	"k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"os"
	"testing"
)

type DockerRegistryControllerSuite struct {
	BasicSuite
	registry *v1alpha1.DockerRegistry
}

func (suite *DockerRegistryControllerSuite) SetupSuite() {
	// allow this test run from multiple places
	_ = godotenv.Load("../.env")
	_ = godotenv.Load()

	if os.Getenv("KAPP_TEST_DOCKER_REGISTRY_PASSWORD") == "" || os.Getenv("KAPP_TEST_DOCKER_REGISTRY_USERNAME") == "" {
		suite.T().Skip()
	}

	suite.BasicSuite.SetupSuite()
}

func (suite *DockerRegistryControllerSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *DockerRegistryControllerSuite) SetupTest() {
	registry := &v1alpha1.DockerRegistry{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      "gke-registry",
			Namespace: "kapp-system",
		},
		Spec: v1alpha1.DockerRegistrySpec{
			Host: "https://gcr.io",
		},
		Status: v1alpha1.DockerRegistryStatus{
			AuthenticationVerified: false,
			Repositories:           []*v1alpha1.Repository{},
		},
	}

	secret := v1.Secret{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      "gke-registry-authentication",
			Namespace: "kapp-system",
		},
		Data: map[string][]byte{
			"username": []byte(os.Getenv("KAPP_TEST_DOCKER_REGISTRY_USERNAME")),
			"password": []byte(os.Getenv("KAPP_TEST_DOCKER_REGISTRY_PASSWORD")),
		},
	}
	suite.Nil(suite.K8sClient.Create(context.Background(), &secret))
	suite.createDockerRegistry(registry)
	suite.registry = registry
}

func (suite *DockerRegistryControllerSuite) TestDockerRegistryBasicCRUD() {
	suite.Eventually(func() bool {
		suite.reloadObject(getDockerRegistryNamespacedName(suite.registry), suite.registry)
		return suite.registry.Status.AuthenticationVerified
	})
}

func TestDockerRegistryControllerSuite(t *testing.T) {
	suite.Run(t, new(DockerRegistryControllerSuite))
}
