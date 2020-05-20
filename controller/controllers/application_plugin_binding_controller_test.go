package controllers

import (
	"context"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	istioV1Beta1 "istio.io/client-go/pkg/apis/networking/v1beta1"
	"k8s.io/apimachinery/pkg/api/errors"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"strings"
	"testing"
)

type ApplicationPluginBindingControllerSuite struct {
	BasicSuite

	application   *v1alpha1.Application
	plugin        *v1alpha1.ApplicationPlugin
	pluginBinding *v1alpha1.ApplicationPluginBinding
}

func (suite *ApplicationPluginBindingControllerSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite()
}

func (suite *ApplicationPluginBindingControllerSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *ApplicationPluginBindingControllerSuite) SetupTest() {
	application := generateEmptyApplication()
	suite.createApplication(application)
	suite.application = application

	plugin := generateEmptyApplicationPlugin()
	plugin.Spec.Src = `
function BeforeApplicationSave(application) {
	var config = getConfig();

	if (!config) {
		return application;
	}

	if (!application.metadata.labels) {
		application.metadata.labels = {};
	}

	application.metadata.labels[config.newLabelName] = config.newLabelValue;

	return application;
}`
	plugin.Spec.ConfigSchema = &runtime.RawExtension{
		Raw: []byte(`{"type":"object","properties":{"newLabelName":{"type":"string"}, "newLabelValue":{"type": "string"}}}`),
	}
	suite.createApplicationPlugin(plugin)
	suite.plugin = plugin

	suite.Eventually(func() bool {
		suite.reloadObject(types.NamespacedName{Name: plugin.Name}, plugin)
		return plugin.Status.CompiledSuccessfully
	}, "plugin should be compiled")

	binding := &v1alpha1.ApplicationPluginBinding{
		ObjectMeta: v1.ObjectMeta{
			Namespace: suite.application.Name,
			Name:      suite.plugin.Name,
		},
		Spec: v1alpha1.ApplicationPluginBindingSpec{
			PluginName: suite.plugin.Name,
			Config:     &runtime.RawExtension{Raw: []byte(`{"newLabelName": "label", "newLabelValue": "value"}`)},
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

		return binding.Labels["kapp-plugin"] == suite.plugin.Name &&
			binding.Status.ConfigValid &&
			binding.Status.ConfigError == ""

	}, "plugin binding status is not correct")

	suite.pluginBinding = binding

	suite.reloadObject(types.NamespacedName{
		Name: application.Name,
	}, application)

	suite.Eventually(func() bool {
		suite.reloadObject(types.NamespacedName{Name: suite.application.Name}, suite.application)
		return suite.application.Labels["label"] == "value"
	}, "application should be updated")
}

func TestApplicationPluginBindingControllerSuite(t *testing.T) {
	suite.Run(t, new(ApplicationPluginBindingControllerSuite))
}

func (suite *ApplicationPluginBindingControllerSuite) TestPluginBindingDisabled() {
	suite.reloadObject(types.NamespacedName{Name: suite.pluginBinding.Name, Namespace: suite.pluginBinding.Namespace}, suite.pluginBinding)
	suite.pluginBinding.Spec.IsDisabled = true
	suite.updateObject(suite.pluginBinding)

	suite.Eventually(func() bool {
		suite.reloadObject(types.NamespacedName{Name: suite.application.Name}, suite.application)
		return suite.application.Labels == nil || suite.application.Labels["label"] == ""
	}, "application should be updated")
}

func (suite *ApplicationPluginBindingControllerSuite) TestDeletePlugin() {
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

	suite.Eventually(func() bool {
		suite.reloadObject(types.NamespacedName{Name: suite.application.Name}, suite.application)
		return suite.application.Labels == nil || suite.application.Labels["label"] == ""
	}, "application should be updated")
}

func (suite *ApplicationPluginBindingControllerSuite) TestDeletePluginBinding() {
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

	suite.Eventually(func() bool {
		suite.reloadObject(types.NamespacedName{Name: suite.application.Name}, suite.application)
		return suite.application.Labels == nil || suite.application.Labels["label"] == ""
	}, "application should be updated")
}

func (suite *ApplicationPluginBindingControllerSuite) TestUpdateApplicationPluginBindingConfig() {
	// Please see the initialization function to understand the test context
	suite.pluginBinding.Spec.Config = &runtime.RawExtension{
		Raw: []byte(`{"newLabelName": "label", "newLabelValue": "value2"}`),
	}
	suite.Nil(suite.K8sClient.Update(context.Background(), suite.pluginBinding))

	suite.Eventually(func() bool {
		suite.reloadObject(types.NamespacedName{Name: suite.application.Name}, suite.application)
		return suite.application.Labels["label"] == "value2"
	}, "application should be updated")
}

func (suite *ApplicationPluginBindingControllerSuite) TestBuildInAppPluginBindingIngress() {

	appPluginIngress := generateEmptyApplicationPlugin()
	appPluginIngress.Name = `kapp-builtin-application-plugin-ingress`
	appPluginIngress.Spec.Src = `
function AfterApplicationSaved() {
  __builtinApplicationPluginIngress();
}
`
	//appPluginIngress.Spec.ConfigSchema = &runtime.RawExtension{
	//	Raw: []byte(`{"type":"object","properties":{"newLabelName":{"type":"string"}, "newLabelValue":{"type": "string"}}}`),
	//}

	issuer := genEmptyCAHttpsCertIssuer()
	suite.createHttpsCertIssuer(issuer)
	cert := genHttpsCert(issuer.Name, "httpscert-sample")
	suite.createHttpsCert(cert)

	suite.createApplicationPlugin(appPluginIngress)

	suite.Eventually(func() bool {
		suite.reloadObject(types.NamespacedName{Name: appPluginIngress.Name}, appPluginIngress)
		return appPluginIngress.Status.CompiledSuccessfully
	}, "plugin should be compiled")

	binding := &v1alpha1.ApplicationPluginBinding{
		ObjectMeta: v1.ObjectMeta{
			Namespace: suite.application.Name,
			Name:      appPluginIngress.Name,
		},
		Spec: v1alpha1.ApplicationPluginBindingSpec{
			PluginName: appPluginIngress.Name,
			Config: &runtime.RawExtension{Raw: []byte(`{
  "hosts": [
    "demo.com"
  ],
  "httpsCert": "httpscert-sample",
  "paths": [
    "/abc",
    "/"
  ],
  "stripPath": true,
  "destinations": [
    {
      "destination": "server-v1",
      "weight": 50
    },
    {
      "destination": "server-v2",
      "weight": 50
    }
  ]
}`)},
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

		return binding.Labels["kapp-plugin"] == appPluginIngress.Name &&
			binding.Status.ConfigValid &&
			binding.Status.ConfigError == ""

	}, "plugin binding status is not correct")

	gw := suite.gwHttpsIsCorrectlySetByIngressPlugin()

	//delete gw will recover with same config
	suite.Nil(suite.K8sClient.Delete(context.Background(), &gw))
	suite.gwHttpsIsCorrectlySetByIngressPlugin()

	//delete appPluginBinding will clean https config in gw
	suite.Nil(suite.K8sClient.Delete(context.Background(), binding))
	suite.gwHttpsIsCorrectlyRemovedByIngressPlugin()
}

func (suite *ApplicationPluginBindingControllerSuite) gwHttpsIsCorrectlySetByIngressPlugin() istioV1Beta1.Gateway {
	gw := istioV1Beta1.Gateway{}
	suite.Eventually(func() bool {
		return suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Namespace: suite.application.Name,
			Name:      "gateway",
		}, &gw) == nil
	})

	suite.True(len(gw.Spec.Servers) == 2)

	var httpsServerExist bool
	for _, s := range gw.Spec.Servers {
		if s.Port == nil || s.Port.Protocol != "HTTPS" {
			continue
		}

		httpsServerExist = true
		existHttpsHost := strings.Join(s.Hosts, ",")
		suite.Equal("demo.com", existHttpsHost)
	}

	suite.True(httpsServerExist)

	return gw
}

func (suite *ApplicationPluginBindingControllerSuite) gwHttpsIsCorrectlyRemovedByIngressPlugin() istioV1Beta1.Gateway {
	gw := istioV1Beta1.Gateway{}

	suite.Eventually(func() bool {
		if err := suite.K8sClient.Get(context.Background(), types.NamespacedName{
			Namespace: suite.application.Name,
			Name:      "gateway",
		}, &gw); err != nil {
			return false
		}

		if len(gw.Spec.Servers) != 1 {
			return false
		}

		return true
	})

	suite.Equal("HTTP", gw.Spec.Servers[0].Port.Protocol)

	return gw
}
