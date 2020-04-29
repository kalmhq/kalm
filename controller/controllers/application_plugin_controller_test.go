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

type ApplicationPluginControllerSuite struct {
	BasicSuite
}

func (suite *ApplicationPluginControllerSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite()
}

func (suite *ApplicationPluginControllerSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *ApplicationPluginControllerSuite) SetupTest() {
}

func TestApplicationPluginControllerSuite(t *testing.T) {
	suite.Run(t, new(ApplicationPluginControllerSuite))
}

//
func generateEmptyApplicationPlugin() *v1alpha1.ApplicationPlugin {
	name := randomName()[:12]

	plugin := &v1alpha1.ApplicationPlugin{
		TypeMeta: metaV1.TypeMeta{
			Kind:       "ApplicationPlugin",
			APIVersion: "core.kapp.dev/v1alpha1",
		},
		ObjectMeta: metaV1.ObjectMeta{
			Name: name,
		},
		Spec: v1alpha1.ApplicationPluginSpec{
			Src: `
function BeforeDeploymentSave(deployment) {
	console.log("test");
    return deployment;
}`,
		},
	}

	return plugin
}

func getApplicationPluginNamespacedName(plugin *v1alpha1.ApplicationPlugin) types.NamespacedName {
	// cluster scope resource
	return types.NamespacedName{Name: plugin.Name, Namespace: ""}
}

func (suite *ApplicationPluginControllerSuite) updatePlugin(plugin *v1alpha1.ApplicationPlugin) {
	suite.Nil(suite.K8sClient.Update(context.Background(), plugin))
}

func (suite *ApplicationPluginControllerSuite) reloadPlugin(plugin *v1alpha1.ApplicationPlugin) {
	suite.Nil(suite.K8sClient.Get(context.Background(), getApplicationPluginNamespacedName(plugin), plugin))
}

func (suite *ApplicationPluginControllerSuite) TestApplicationPluginBasicCRUD() {
	// Create
	plugin := generateEmptyApplicationPlugin()
	plugin.Spec.Src = ""
	suite.createApplicationPlugin(plugin)

	// Get
	suite.Eventually(func() bool {
		return suite.K8sClient.Get(context.Background(), getApplicationPluginNamespacedName(plugin), plugin) == nil
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
		return errors.IsNotFound(suite.K8sClient.Get(context.Background(), getApplicationPluginNamespacedName(plugin), plugin))
	})
}
