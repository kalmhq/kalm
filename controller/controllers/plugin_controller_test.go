package controllers

import (
	"context"
	"github.com/kapp-staging/kapp/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	"k8s.io/apimachinery/pkg/api/errors"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"testing"
)

type PluginControllerSuite struct {
	BasicSuite
}

func (suite *PluginControllerSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite()
}

func (suite *PluginControllerSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *PluginControllerSuite) SetupTest() {
}

func TestPluginControllerSuite(t *testing.T) {
	suite.Run(t, new(PluginControllerSuite))
}

//
func generateEmptyPlugin() *v1alpha1.Plugin {
	name := randomName()[:12]

	plugin := &v1alpha1.Plugin{
		TypeMeta: metaV1.TypeMeta{
			Kind:       "Plugin",
			APIVersion: "core.kapp.dev/v1alpha1",
		},
		ObjectMeta: metaV1.ObjectMeta{
			Name: name,
		},
		Spec: v1alpha1.PluginSpec{
			Src:                   "",
			AvailableWorkloadType: []v1alpha1.WorkloadType{},
		},
	}

	return plugin
}

func getPluginNamespacedName(plugin *v1alpha1.Plugin) types.NamespacedName {
	// cluster scope resource
	return types.NamespacedName{Name: plugin.Name, Namespace: ""}
}

func (suite *PluginControllerSuite) updatePlugin(plugin *v1alpha1.Plugin) {
	suite.Nil(suite.K8sClient.Update(context.Background(), plugin))
}

func (suite *PluginControllerSuite) reloadPlugin(plugin *v1alpha1.Plugin) {
	suite.Nil(suite.K8sClient.Get(context.Background(), getPluginNamespacedName(plugin), plugin))
}

func (suite *PluginControllerSuite) createPlugin(plugin *v1alpha1.Plugin) {
	suite.Nil(suite.K8sClient.Create(context.Background(), plugin))

	// after the finalizer is set, the plugin won't auto change
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), getPluginNamespacedName(plugin), plugin)

		if err != nil {
			return false
		}

		for i := range plugin.Finalizers {
			if plugin.Finalizers[i] == finalizerName {
				return true
			}
		}

		return false
	})
}

func (suite *PluginControllerSuite) TestPluginBasicCRUD() {
	// Create
	plugin := generateEmptyPlugin()
	suite.createPlugin(plugin)

	// Get
	suite.Eventually(func() bool {
		return suite.K8sClient.Get(context.Background(), getPluginNamespacedName(plugin), plugin) == nil
	})
	suite.False(plugin.Status.CompiledSuccessfully)

	// Update
	plugin.Spec.Src = "console.log(\"hello world!\");"
	suite.updatePlugin(plugin)
	suite.Eventually(func() bool {
		suite.reloadPlugin(plugin)
		return plugin.Status.CompiledSuccessfully
	})

	// Update to bad src
	plugin.Spec.Src = "bad source! This source code won't pass compile stage."
	suite.updatePlugin(plugin)
	suite.Eventually(func() bool {
		suite.reloadPlugin(plugin)
		return !plugin.Status.CompiledSuccessfully
	})

	// Delete
	suite.reloadPlugin(plugin)
	suite.Nil(suite.K8sClient.Delete(context.Background(), plugin))

	// Read after deletion
	suite.Eventually(func() bool {
		return errors.IsNotFound(suite.K8sClient.Get(context.Background(), getPluginNamespacedName(plugin), plugin))
	})
}
