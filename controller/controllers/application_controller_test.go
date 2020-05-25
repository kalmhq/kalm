package controllers

import (
	"context"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
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

//func (suite *ApplicationControllerSuite) TestGatewayExistForEachApplication() {
//
//	// Create Application
//	application := generateEmptyApplication()
//	suite.createApplication(application)
//
//	// Ready
//	suite.Eventually(func() bool {
//		return suite.K8sClient.Get(context.Background(), getApplicationNamespacedName(application), application) == nil
//	})
//
//	// gateway exist
//	gw := istioV1Beta1.Gateway{}
//	suite.Eventually(func() bool {
//		return suite.K8sClient.Get(context.Background(), types.NamespacedName{
//			Namespace: application.Name,
//			Name:      "gateway",
//		}, &gw) == nil
//	})
//
//	// delete gateway
//	suite.Nil(suite.K8sClient.Delete(context.Background(), &gw))
//
//	// gateway should be recovered
//	suite.Eventually(func() bool {
//		return suite.K8sClient.Get(context.Background(), types.NamespacedName{
//			Namespace: application.Name,
//			Name:      "gateway",
//		}, &gw) == nil
//	})
//}

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
