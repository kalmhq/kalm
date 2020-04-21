package controllers

import (
	"context"
	"github.com/kapp-staging/kapp/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"math/rand"
	"testing"
)

type ApplicationControllerSuite struct {
	BasicSuite
}

func (suite *ApplicationControllerSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite()
}

func (suite *ApplicationControllerSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func TestApplicationControllerSuite(t *testing.T) {
	suite.Run(t, new(ApplicationControllerSuite))
}

func (suite *ApplicationControllerSuite) TestBasicCRUD() {
	// Create
	application := generateEmptyApplication()
	suite.createApplication(application)

	// Ready
	suite.Eventually(func() bool {
		return suite.K8sClient.Get(context.Background(), getApplicationNamespacedName(application), application) == nil
	})
	// Update
	application.Spec.SharedEnv = append(application.Spec.SharedEnv, v1alpha1.EnvVar{
		Name:  "name",
		Value: "value",
		Type:  v1alpha1.EnvVarTypeStatic,
	})

	suite.updateApplication(application)
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), getApplicationNamespacedName(application), application)
		if err != nil {
			return false
		}
		return len(application.Spec.SharedEnv) == 1 && application.Spec.SharedEnv[0].Value == "value"
	})

	// Delete
	suite.Eventually(func() bool {
		suite.reloadApplication(application)
		return suite.K8sClient.Delete(context.Background(), application) == nil
	})

	// Read after delete
	suite.Eventually(func() bool {
		f := &v1alpha1.Application{}
		return errors.IsNotFound(suite.K8sClient.Get(context.Background(), getApplicationNamespacedName(application), f))
	}, "application should not be fetched")

	suite.Eventually(func() bool {
		n := &coreV1.Namespace{}
		// No matter how big the timeout is, the namespace still exists with a non-nil deletionTimestamp.
		return errors.IsNotFound(suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: application.Name}, n)) || n.DeletionTimestamp != nil
	}, "namespace should not be fetched")
}

var letterRunes = []rune("abcdefghijklmnopqrstuvwxyz")

//regex used for validation is '[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*'
func randomName() string {
	b := make([]rune, 12)
	for i := range b {
		b[i] = letterRunes[rand.Intn(len(letterRunes))]
	}
	return string(b)
}

func generateEmptyApplication() *v1alpha1.Application {
	name := randomName()[:12]

	application := &v1alpha1.Application{
		TypeMeta: metaV1.TypeMeta{
			Kind:       "Application",
			APIVersion: "core.kapp.dev/v1alpha1",
		},
		ObjectMeta: metaV1.ObjectMeta{
			Name: name,
		},
		Spec: v1alpha1.ApplicationSpec{
			IsActive:  true,
			SharedEnv: []v1alpha1.EnvVar{},
		},
	}

	return application
}

func getApplicationNamespacedName(app *v1alpha1.Application) types.NamespacedName {
	return types.NamespacedName{Name: app.Name, Namespace: ""}
}

func (suite *ApplicationControllerSuite) reloadApplication(application *v1alpha1.Application) {
	suite.Nil(suite.K8sClient.Get(context.Background(), getApplicationNamespacedName(application), application))
}

func (suite *ApplicationControllerSuite) updateApplication(application *v1alpha1.Application) {
	suite.Nil(suite.K8sClient.Update(context.Background(), application))
}

func (suite *ApplicationControllerSuite) createApplication(application *v1alpha1.Application) {
	suite.Nil(suite.K8sClient.Create(context.Background(), application))

	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), getApplicationNamespacedName(application), application)

		if err != nil {
			return false
		}

		for i := range application.Finalizers {
			if application.Finalizers[i] == finalizerName {
				return true
			}
		}

		return false
	}, "Created application has no finalizer.")
}

//
//func deleteApplication(application *v1alpha1.Application) {
//	Expect(k8sClient.Delete(context.Background(), application)).Should(Succeed())
//}
//
//func getApplicationDeployments(application *v1alpha1.Application) []v1.Deployment {
//	var deploymentList v1.DeploymentList
//	_ = k8sClient.List(context.Background(), &deploymentList, client.MatchingLabels{"kapp-application": application.Name})
//	return deploymentList.Items
//}
//
//func getApplicationServices(application *v1alpha1.Application) []coreV1.Service {
//	var serviceList coreV1.ServiceList
//	_ = k8sClient.List(context.Background(), &serviceList, client.MatchingLabels{"kapp-application": application.Name})
//	return serviceList.Items
//}
//
//func getApplicationPVCs(application *v1alpha1.Application) []coreV1.PersistentVolumeClaim {
//	var pvcList coreV1.PersistentVolumeClaimList
//	_ = k8sClient.List(context.Background(), &pvcList, client.MatchingLabels{"kapp-application": application.Name})
//	return pvcList.Items
//}
//
//const timeout = time.Second * 20
//const interval = time.Millisecond * 500
//
//var _ = Describe("Application Envs", func() {
//	defer GinkgoRecover()
//
//	// generate an application with a single component
//	generateApplication := func() *v1alpha1.Application {
//		app := generateEmptyApplication()
//		app.Spec.Components = append(app.Spec.Components, v1alpha1.ComponentSpec{
//			Name:  "test",
//			Image: "nginx:latest",
//			Env: []v1alpha1.EnvVar{
//				{
//					Name:  "foo",
//					Value: "bar",
//					Type:  v1alpha1.EnvVarTypeStatic,
//				},
//			},
//			Ports: []v1alpha1.Port{
//				{
//					Name:          "test",
//					ContainerPort: 8080,
//					ServicePort:   80,
//					Protocol:      coreV1.ProtocolTCP,
//				},
//			},
//		})
//		return app
//	}
//
//	It("should delete related resources when isActive is false", func() {
//		application := generateApplication()
//		createApplication(application)
//
//		// will has a deployment
//		var deployments []v1.Deployment
//		var services []coreV1.Service
//		Eventually(func() bool {
//			deployments = getApplicationDeployments(application)
//			services = getApplicationServices(application)
//			return len(deployments) == 1 && len(services) == 1
//		}, timeout, interval).Should(Equal(true))
//
//		reloadApplication(application)
//		application.Spec.IsActive = false
//		updateApplication(application)
//
//		Eventually(func() bool {
//			deployments = getApplicationDeployments(application)
//			services = getApplicationServices(application)
//			return len(deployments) == 0 && len(services) == 0
//		}, timeout, interval).Should(Equal(true))
//
//		reloadApplication(application)
//		application.Spec.IsActive = true
//		updateApplication(application)
//
//		Eventually(func() bool {
//			deployments = getApplicationDeployments(application)
//			services = getApplicationServices(application)
//			return len(deployments) == 1 && len(services) == 1
//		}, timeout, interval).Should(Equal(true))
//	})
//
//})
