package client

import (
	"github.com/kapp-staging/kapp/api/auth"
	"github.com/kapp-staging/kapp/api/config"
	"github.com/labstack/echo/v4"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/tools/clientcmd/api"
	"log"
)

const (
	// Default cluster/context/auth name to be set in clientcmd config
	DefaultCmdConfigName = "default"
)

type ClientManager struct {
	Config        *config.Config
	ClusterConfig *rest.Config
}

func (m *ClientManager) isInCluster() bool {
	return m.Config.KubernetesApiServerAddress == "" && m.Config.KubeConfigPath == ""
}

func (m *ClientManager) buildCmdConfig(authInfo *api.AuthInfo, cfg *rest.Config) clientcmd.ClientConfig {
	cmdCfg := api.NewConfig()
	cmdCfg.Clusters[DefaultCmdConfigName] = &api.Cluster{
		Server:                   cfg.Host,
		CertificateAuthority:     cfg.TLSClientConfig.CAFile,
		CertificateAuthorityData: cfg.TLSClientConfig.CAData,
		InsecureSkipTLSVerify:    cfg.TLSClientConfig.Insecure,
	}
	cmdCfg.AuthInfos[DefaultCmdConfigName] = authInfo
	cmdCfg.Contexts[DefaultCmdConfigName] = &api.Context{
		Cluster:  DefaultCmdConfigName,
		AuthInfo: DefaultCmdConfigName,
	}
	cmdCfg.CurrentContext = DefaultCmdConfigName

	return clientcmd.NewDefaultClientConfig(
		*cmdCfg,
		&clientcmd.ConfigOverrides{},
	)
}

func (m *ClientManager) IsAuthInfoWorking(authInfo *api.AuthInfo) error {
	cfg, err := m.getClientConfigWithAuthInfo(authInfo)
	if err != nil {
		return err
	}

	client, err := kubernetes.NewForConfig(cfg)
	if err != nil {
		return err
	}

	_, err = client.ServerVersion()
	return err
}

func (m *ClientManager) initClusterClientConfiguration() (err error) {
	var cfg *rest.Config

	if m.isInCluster() {
		cfg, err = rest.InClusterConfig()
	} else {
		if m.Config.KubernetesApiServerAddress != "" {
			TLSClientConfig := rest.TLSClientConfig{}

			if m.Config.KubernetesApiServerCAFilePath != "" {
				TLSClientConfig.CAFile = m.Config.KubernetesApiServerCAFilePath
			}

			cfg = &rest.Config{
				Host:            m.Config.KubernetesApiServerAddress,
				TLSClientConfig: TLSClientConfig,
			}
		} else if m.Config.KubeConfigPath != "" {
			cfg, err = clientcmd.NewNonInteractiveDeferredLoadingClientConfig(
				&clientcmd.ClientConfigLoadingRules{ExplicitPath: m.Config.KubeConfigPath},
				&clientcmd.ConfigOverrides{}).ClientConfig()
		}
	}

	if err != nil {
		return err
	}

	m.ClusterConfig = cfg
	return nil
}

func (m *ClientManager) getClientConfigWithAuthInfo(authInfo *api.AuthInfo) (*rest.Config, error) {
	clientConfig := m.buildCmdConfig(authInfo, m.ClusterConfig)

	cfg, err := clientConfig.ClientConfig()
	if err != nil {
		return nil, err
	}

	return cfg, nil
}

func (m *ClientManager) extractAuthInfo(c echo.Context) (*api.AuthInfo, error) {
	req := c.Request()
	authHeader := req.Header.Get(echo.HeaderAuthorization)
	token := auth.ExtractTokenFromHeader(authHeader)

	// TODO Impersonate

	if token != "" {
		authInfo := &api.AuthInfo{Token: token}
		return authInfo, nil
	}

	return nil, echo.ErrUnauthorized
}

func (m *ClientManager) GetClientConfig(c echo.Context) (*rest.Config, error) {
	authInfo, err := m.extractAuthInfo(c)

	if err != nil {
		return nil, err
	}

	return m.getClientConfigWithAuthInfo(authInfo)
}

func NewClientManager(config *config.Config) *ClientManager {
	m := &ClientManager{
		Config: config,
	}

	err := m.initClusterClientConfiguration()

	if err != nil {
		log.Fatal("[Fatal] initClusterClientConfiguration failed: ", err)
	}

	return m
}
