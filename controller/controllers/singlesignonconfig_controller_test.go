package controllers

import (
	"bytes"
	"context"
	"fmt"
	"testing"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	"gopkg.in/yaml.v3"
	appsV1 "k8s.io/api/apps/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/log"
)

type SSOConfigControllerSuite struct {
	BasicSuite
	ctx    context.Context
	logger *log.DelegatingLogger
}

func TestSSOConfigControllerSuite(t *testing.T) {
	suite.Run(t, new(SSOConfigControllerSuite))
}

func (suite *SSOConfigControllerSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite(true)
	suite.logger = ctrl.Log
	suite.ensureNsExists("kalm-system")
}

func (suite *SSOConfigControllerSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *SSOConfigControllerSuite) SetupTest() {
	suite.ctx = context.Background()
}

type DexConfigLike struct {
	Issuer     string `yaml:"issuer"`
	Connectors []struct {
		Config struct {
			RedirectURI string `yaml:"redirectURI"`
		} `yaml:"config"`
	} `yaml:"connectors"`
	StaticClients []struct {
		RedirectURIs []string `yaml:"redirectURIs"`
	} `yaml:"staticClients"`
}

func (suite *SSOConfigControllerSuite) checkDexConfigFile(configString, issuer, dexRedirectURI, clientRedirectURI string) bool {
	var config DexConfigLike

	if err := yaml.NewDecoder(bytes.NewBufferString(configString)).Decode(&config); err != nil {
		suite.logger.Info(fmt.Sprintf("Decode yaml error: %+v", err))
		return false
	}

	if config.Issuer != issuer {
		suite.logger.Info(fmt.Sprintf("issuer not equal %s %s", config.Issuer, issuer))
		return false
	}

	if len(config.Connectors) != 1 {
		suite.logger.Info("connectors length is not 1")
		return false
	}

	if config.Connectors[0].Config.RedirectURI != dexRedirectURI {
		suite.logger.Info(fmt.Sprintf("Connector redirectURI not equal %s %s", config.Connectors[0].Config.RedirectURI, dexRedirectURI))
		return false
	}

	if len(config.StaticClients) != 1 || len(config.StaticClients[0].RedirectURIs) != 1 {
		suite.logger.Info("StaticClients length is not 1")
		return false
	}

	if config.StaticClients[0].RedirectURIs[0] != clientRedirectURI {
		suite.logger.Info(fmt.Sprintf("Client redirectURI not equal %s %s", config.StaticClients[0].RedirectURIs[0], clientRedirectURI))
		return false
	}

	return true
}

func (suite *SSOConfigControllerSuite) TestSSOBasicCRUD() {
	domain := "auth.example.com"

	ssoConfig := v1alpha1.SingleSignOnConfig{
		ObjectMeta: metaV1.ObjectMeta{
			Namespace: "kalm-system",
			Name:      "sso",
		},
		Spec: v1alpha1.SingleSignOnConfigSpec{
			Domain: domain,
			Connectors: []v1alpha1.DexConnector{
				{
					Type: "gitlab",
					ID:   "id",
					Name: "name",
					Config: &runtime.RawExtension{Raw: []byte(`{
						"clientID": "fake-id",
						"clientSecret": "fake-sec",
						"groups": ["fake-group"]
					}`)},
				},
			},
		},
	}

	suite.createObject(&ssoConfig)

	var component v1alpha1.Component
	suite.Eventually(func() bool {
		if err := suite.K8sClient.Get(suite.ctx, types.NamespacedName{
			Name:      "dex",
			Namespace: "kalm-system",
		}, &component); err != nil {
			return false
		}

		if component.Spec.PreInjectedFiles == nil || len(component.Spec.PreInjectedFiles) != 1 {
			return false
		}

		return suite.checkDexConfigFile(
			component.Spec.PreInjectedFiles[0].Content,
			"https://auth.example.com/dex",
			"https://auth.example.com/dex/callback",
			"https://auth.example.com/oidc/callback",
		)
	})

	// will create a dex deployment under kalm-system namespace
	var deployment appsV1.Deployment

	suite.Eventually(func() bool {

		if err := suite.K8sClient.Get(suite.ctx, types.NamespacedName{
			Name:      "dex",
			Namespace: "kalm-system",
		}, &deployment); err != nil {
			return false
		}

		return true
	})

	// will create a dex route
	var route v1alpha1.HttpRoute
	suite.Eventually(func() bool {
		if err := suite.K8sClient.Get(suite.ctx, types.NamespacedName{
			Name: "dex",
		}, &route); err != nil {
			return false
		}

		return len(route.Spec.Hosts) == 1 &&
			route.Spec.Hosts[0] == domain &&
			route.Spec.HttpRedirectToHttps &&
			route.Spec.Paths[0] == "/dex" &&
			route.Spec.Destinations[0].Host == "dex.kalm-system.svc.cluster.local:5556"
	})

	suite.reloadObject(types.NamespacedName{Name: ssoConfig.Name, Namespace: ssoConfig.Namespace}, &ssoConfig)

	ssoConfig.Spec.UseHttp = true
	newPort := 31111
	ssoConfig.Spec.Port = &newPort

	suite.updateObject(&ssoConfig)

	suite.Eventually(func() bool {
		if err := suite.K8sClient.Get(suite.ctx, types.NamespacedName{
			Name: "dex",
		}, &route); err != nil {
			return false
		}

		return len(route.Spec.Hosts) == 1 &&
			!route.Spec.HttpRedirectToHttps
	})

	suite.Eventually(func() bool {
		if err := suite.K8sClient.Get(suite.ctx, types.NamespacedName{
			Name:      "dex",
			Namespace: "kalm-system",
		}, &component); err != nil {
			return false
		}

		if component.Spec.PreInjectedFiles == nil || len(component.Spec.PreInjectedFiles) != 1 {
			return false
		}

		return suite.checkDexConfigFile(
			component.Spec.PreInjectedFiles[0].Content,
			"http://auth.example.com:31111/dex",
			"http://auth.example.com:31111/dex/callback",
			"http://auth.example.com:31111/oidc/callback",
		)
	})
}
