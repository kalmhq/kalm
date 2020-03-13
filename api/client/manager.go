package client

import (
	"github.com/kapp-staging/kapp/api/auth"
	"github.com/labstack/echo/v4"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/tools/clientcmd/api"
)

const (
	// Default cluster/context/auth name to be set in clientcmd config
	DefaultCmdConfigName = "default"
)

type ClientManager struct {
	ApiServerHost  string
	KubeConfigPath string

	inClusterConfig *rest.Config
}

func (m *ClientManager) isInCluster() bool {
	return m.ApiServerHost == "" && m.KubeConfigPath == ""
}

func (m *ClientManager) buildClusterConfig() (*rest.Config, error) {
	if m.isInCluster() {
		return m.inClusterConfig, nil
	} else {
		return clientcmd.NewNonInteractiveDeferredLoadingClientConfig(
			&clientcmd.ClientConfigLoadingRules{ExplicitPath: m.KubeConfigPath},
			&clientcmd.ConfigOverrides{ClusterInfo: api.Cluster{Server: m.ApiServerHost}}).ClientConfig()
	}
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

func (m *ClientManager) initInClusterClientConfiguration() {
	config, err := rest.InClusterConfig()
	if err != nil {
		panic(err.Error())
	}
	m.inClusterConfig = config
}

func (m *ClientManager) getClientConfigWithAuthInfo(authInfo *api.AuthInfo) (*rest.Config, error) {
	cfg, err := m.buildClusterConfig()
	if err != nil {
		return nil, err
	}

	clientConfig := m.buildCmdConfig(authInfo, cfg)

	cfg, err = clientConfig.ClientConfig()
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

func NewClientManager(apiServerHost, kubeConfigPath string) *ClientManager {
	m := &ClientManager{
		ApiServerHost:  apiServerHost,
		KubeConfigPath: kubeConfigPath,
	}

	if m.isInCluster() {
		m.initInClusterClientConfiguration()
	}

	return m
}
