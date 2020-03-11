package client

import (
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

func (c *ClientManager) isInCluster() bool {
	return c.ApiServerHost == "" && c.KubeConfigPath == ""
}

func (c *ClientManager) buildClusterConfig() (*rest.Config, error) {
	if c.isInCluster() {
		return c.inClusterConfig, nil
	} else {
		return clientcmd.NewNonInteractiveDeferredLoadingClientConfig(
			&clientcmd.ClientConfigLoadingRules{ExplicitPath: c.KubeConfigPath},
			&clientcmd.ConfigOverrides{ClusterInfo: api.Cluster{Server: c.ApiServerHost}}).ClientConfig()
	}
}

func (self *ClientManager) buildCmdConfig(authInfo *api.AuthInfo, cfg *rest.Config) clientcmd.ClientConfig {
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

func (c *ClientManager) IsAuthInfoWorking(authInfo *api.AuthInfo) error {
	cfg, err := c.buildClusterConfig()
	if err != nil {
		return err
	}

	clientConfig := c.buildCmdConfig(authInfo, cfg)
	cfg, err = clientConfig.ClientConfig()
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

func (c *ClientManager) initInClusterClientConfiguration() {
	config, err := rest.InClusterConfig()
	if err != nil {
		panic(err.Error())
	}
	c.inClusterConfig = config
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
