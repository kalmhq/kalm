package main

import (
	"github.com/kalmhq/kuench/api/config"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

func initClusterK8sClientConfiguration(config *config.Config) (cfg *rest.Config, err error) {
	if config.IsInCluster() {
		cfg, err = rest.InClusterConfig()
	} else {
		if config.KubernetesApiServerAddress != "" {
			TLSClientConfig := rest.TLSClientConfig{}

			if config.KubernetesApiServerCAFilePath != "" {
				TLSClientConfig.CAFile = config.KubernetesApiServerCAFilePath
			}

			cfg = &rest.Config{
				Host:            config.KubernetesApiServerAddress,
				TLSClientConfig: TLSClientConfig,
			}
		} else if config.KubeConfigPath != "" {
			cfg, err = clientcmd.NewNonInteractiveDeferredLoadingClientConfig(
				&clientcmd.ClientConfigLoadingRules{ExplicitPath: config.KubeConfigPath},
				&clientcmd.ConfigOverrides{}).ClientConfig()
		}
	}

	if err != nil {
		return nil, err
	}

	return
}
