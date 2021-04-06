package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/sirupsen/logrus"
	log "github.com/sirupsen/logrus"
)

type Config struct {
	KubernetesApiServerAddress    string
	KubernetesApiServerCAFilePath string
	KubeConfigPath                string
	Verbose                       bool

	BindAddress string
	Port        int
}

func (c *Config) IsInCluster() bool {
	return c.KubernetesApiServerAddress == "" && c.KubeConfigPath == ""
}

func fileExists(filename string) bool {
	info, err := os.Stat(filename)
	if os.IsNotExist(err) {
		return false
	}
	return !info.IsDir()
}

func (c *Config) Normalize() {
	defaultKubeConfigPath := filepath.Join(os.Getenv("HOME"), ".kube", "config")

	if c.KubeConfigPath == "" && fileExists(defaultKubeConfigPath) && c.KubernetesApiServerAddress == "" && os.Getenv("KUBERNETES_SERVICE_HOST") == "" {
		// server is running out of cluster without api server info provided, and the default kube config exists on default path
		// use the path as default value for KUBE_CONFIG_PATH env
		// This is convenient for development.
		c.KubeConfigPath = defaultKubeConfigPath

		log.WithFields(log.Fields{
			"definedIn": "defaultKubeConfigPath",
		}).Debug("Using cluster of current context")
	}
}

func (c *Config) Install() {
	c.Normalize()

	if c.Verbose {
		logrus.SetFormatter(&log.TextFormatter{})
	} else {
		logrus.SetFormatter(&log.JSONFormatter{})
	}

	log.WithField("config", c).Debug("Config")
}

func (c *Config) GetServerAddress() string {
	var address string

	if c.BindAddress != "0.0.0.0" {
		address = c.BindAddress
	}

	return fmt.Sprintf("%s:%d", address, c.Port)
}
