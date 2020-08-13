package controllers

import (
	"context"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
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
func generateEmptyComponentPlugin() *v1alpha1.ComponentPlugin {
	name := randomName()[:12]

	plugin := &v1alpha1.ComponentPlugin{
		TypeMeta: metaV1.TypeMeta{
			Kind:       "ComponentPlugin",
			APIVersion: "core.kalm.dev/v1alpha1",
		},
		ObjectMeta: metaV1.ObjectMeta{
			Name: name,
		},
		Spec: v1alpha1.ComponentPluginSpec{
			Src: `
function BeforeDeploymentSave(deployment) {
	console.log("test");
    return deployment;
}`,
			AvailableWorkloadType: []v1alpha1.WorkloadType{},
		},
	}

	return plugin
}

func getComponentPluginNamespacedName(plugin *v1alpha1.ComponentPlugin) types.NamespacedName {
	// cluster scope resource
	return types.NamespacedName{Name: plugin.Name, Namespace: ""}
}

func (suite *PluginControllerSuite) updatePlugin(plugin *v1alpha1.ComponentPlugin) {
	suite.Nil(suite.K8sClient.Update(context.Background(), plugin))
}

func (suite *PluginControllerSuite) reloadPlugin(plugin *v1alpha1.ComponentPlugin) {
	suite.Nil(suite.K8sClient.Get(context.Background(), getComponentPluginNamespacedName(plugin), plugin))
}

func (suite *PluginControllerSuite) TestPluginBasicCRUD() {
	// Create
	plugin := generateEmptyComponentPlugin()
	plugin.Spec.Src = "fake-code"
	suite.createComponentPlugin(plugin)

	// Get
	suite.Eventually(func() bool {
		return suite.K8sClient.Get(context.Background(), getComponentPluginNamespacedName(plugin), plugin) == nil
	})
	suite.True(plugin.Status.CompiledSuccessfully)

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
		return errors.IsNotFound(suite.K8sClient.Get(context.Background(), getComponentPluginNamespacedName(plugin), plugin))
	})
}
