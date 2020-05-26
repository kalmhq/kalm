package controllers

import (
	"context"
	"fmt"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	appsV1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"testing"
)

type PluginBindingControllerSuite struct {
	BasicSuite

	//application   *v1alpha1.Application
	namespace     *corev1.Namespace
	component     *v1alpha1.Component
	plugin        *v1alpha1.ComponentPlugin
	pluginBinding *v1alpha1.ComponentPluginBinding
}

func (suite *PluginBindingControllerSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite()
}

func (suite *PluginBindingControllerSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *PluginBindingControllerSuite) SetupTest() {
	//application := generateEmptyApplication()
	//suite.createApplication(application)
	//suite.application = application

	plugin := generateEmptyComponentPlugin()
	plugin.Spec.Src = `
function BeforeDeploymentSave(deployment) {
    var config = getConfig();

    if (!config) {
        return;
	}

    deployment.spec.replicas = config.replicas;
    return deployment;
}`
	plugin.Spec.ConfigSchema = &runtime.RawExtension{
		Raw: []byte(`{"type":"object","properties":{"replicas":{"type":"integer"}}}`),
	}
	suite.createComponentPlugin(plugin)
	suite.plugin = plugin

	component := generateEmptyComponent(suite.namespace.Name)
	suite.createComponent(component)
	suite.component = component

	binding := &v1alpha1.ComponentPluginBinding{
		ObjectMeta: v1.ObjectMeta{
			Namespace: suite.component.Namespace,
			Name:      fmt.Sprintf("%s-%s", suite.component.Name, suite.plugin.Name),
		},
		Spec: v1alpha1.ComponentPluginBindingSpec{
			PluginName:    suite.plugin.Name,
			ComponentName: suite.component.Name,
			Config:        &runtime.RawExtension{Raw: []byte(`{"replicas": 2}`)},
		},
	}

	key := types.NamespacedName{
		Namespace: binding.Namespace,
		Name:      binding.Name,
	}

	// create
	suite.Nil(suite.K8sClient.Create(context.Background(), binding))

	// check binding status
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), key, binding)

		if err != nil {
			return false
		}

		return binding.Labels["kapp-component"] == suite.component.Name &&
			binding.Labels["kapp-plugin"] == suite.plugin.Name &&
			binding.Status.ConfigValid &&
			binding.Status.ConfigError == ""

	}, "plugin binding status is not correct")

	// check component status
	suite.Eventually(func() bool {
		var deployment appsV1.Deployment

		err := suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Namespace: suite.component.Namespace,
			Name:      suite.component.Name,
		}, &deployment)

		if err != nil {
			return false
		}

		return *deployment.Spec.Replicas == int32(2)
	}, "can't get deployment")

	suite.reloadObject(types.NamespacedName{
		Namespace: binding.Namespace,
		Name:      binding.Name,
	}, binding)

	suite.pluginBinding = binding
}

func TestPluginBindingControllerSuite(t *testing.T) {
	suite.Run(t, new(PluginBindingControllerSuite))
}

func (suite *PluginBindingControllerSuite) TestPluginBindingDisabled() {
	suite.reloadObject(types.NamespacedName{Name: suite.pluginBinding.Name, Namespace: suite.pluginBinding.Namespace}, suite.pluginBinding)
	suite.pluginBinding.Spec.IsDisabled = true
	suite.updateObject(suite.pluginBinding)

	// check component status
	suite.Eventually(func() bool {
		var deployment appsV1.Deployment

		err := suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Namespace: suite.component.Namespace,
			Name:      suite.component.Name,
		}, &deployment)

		if err != nil {
			return false
		}

		return *deployment.Spec.Replicas == int32(1)
	}, "can't get deployment")
}

func (suite *PluginBindingControllerSuite) TestDeletePlugin() {
	// Please see the initialization function to understand the test context
	suite.Nil(suite.K8sClient.Delete(context.Background(), suite.plugin))

	// plugin should be not found
	suite.Eventually(func() bool {
		return errors.IsNotFound(suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Name: suite.plugin.Name,
		}, suite.plugin))
	})

	// binding should be deleted too
	suite.Eventually(func() bool {
		return errors.IsNotFound(suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Name:      suite.pluginBinding.Name,
			Namespace: suite.pluginBinding.Namespace,
		}, suite.pluginBinding))
	})

	// deployment replica should be 1
	suite.Eventually(func() bool {
		var deployment appsV1.Deployment

		err := suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Namespace: suite.component.Namespace,
			Name:      suite.component.Name,
		}, &deployment)

		if err != nil {
			return false
		}

		return *deployment.Spec.Replicas == int32(1)
	})
}

func (suite *PluginBindingControllerSuite) TestDeletePluginBinding() {
	// Please see the initialization function to understand the test context
	suite.Nil(suite.K8sClient.Delete(context.Background(), suite.pluginBinding))

	// plugin should exist
	suite.Eventually(func() bool {
		return suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Name: suite.plugin.Name,
		}, suite.plugin) == nil
	})

	// binding should be deleted
	suite.Eventually(func() bool {
		return errors.IsNotFound(suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Name:      suite.pluginBinding.Name,
			Namespace: suite.pluginBinding.Namespace,
		}, suite.pluginBinding))
	})

	// deployment replica should be 1
	suite.Eventually(func() bool {
		var deployment appsV1.Deployment

		err := suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Namespace: suite.component.Namespace,
			Name:      suite.component.Name,
		}, &deployment)

		if err != nil {
			return false
		}

		return *deployment.Spec.Replicas == int32(1)
	})
}

func (suite *PluginBindingControllerSuite) TestDeleteComponent() {
	// Please see the initialization function to understand the test context
	suite.Nil(suite.K8sClient.Delete(context.Background(), suite.component))

	// plugin should exist
	suite.Eventually(func() bool {
		return suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Name: suite.plugin.Name,
		}, suite.plugin) == nil
	})

	// binding should be deleted
	suite.Eventually(func() bool {
		return errors.IsNotFound(suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Name:      suite.pluginBinding.Name,
			Namespace: suite.pluginBinding.Namespace,
		}, suite.pluginBinding))
	})

	// deployment should be deleted
	suite.Eventually(func() bool {
		var deployment appsV1.Deployment

		return errors.IsNotFound(suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Namespace: suite.component.Namespace,
			Name:      suite.component.Name,
		}, &deployment))
	})
}

func (suite *PluginBindingControllerSuite) TestUpdateBindingConfig() {
	// Please see the initialization function to understand the test context

	suite.pluginBinding.Spec.Config = &runtime.RawExtension{
		Raw: []byte(`{"replicas": 3}`),
	}
	suite.Nil(suite.K8sClient.Update(context.Background(), suite.pluginBinding))

	// deployment replica should be 3
	suite.Eventually(func() bool {
		var deployment appsV1.Deployment

		err := suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Namespace: suite.component.Namespace,
			Name:      suite.component.Name,
		}, &deployment)

		if err != nil {
			return false
		}

		return *deployment.Spec.Replicas == int32(3)
	})
}
