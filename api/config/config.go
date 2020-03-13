package config

import (
	"fmt"
	log "github.com/sirupsen/logrus"
	"github.com/urfave/cli/v2"
	"os"
	"path/filepath"
)

type Config struct {
	BindAddress                   string
	Port                          int
	LogLevel                      string
	KubernetesApiServerAddress    string
	KubernetesApiServerCAFilePath string
	KubeConfigPath                string
	CorsAllowedOrigins            cli.StringSlice
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

		log.Debugf("Using cluster of current context defined in %s", defaultKubeConfigPath)
	}
}

func (c *Config) Validate() {

}

func setLogLevel(level string) {
	switch level {
	case "INFO":
	case "":
		log.SetLevel(log.InfoLevel)
	case "DEBUG":
		log.SetLevel(log.DebugLevel)
	case "WARN":
		log.SetLevel(log.WarnLevel)
	case "ERROR":
		log.SetLevel(log.ErrorLevel)
	default:
		log.SetLevel(log.InfoLevel)
	}
}

func (c *Config) Install() {
	setLogLevel(c.LogLevel)
	c.Normalize()
	log.Debugf("%#v\n", c)
	c.Validate()
}

func (c *Config) GetServerAddress() string {
	var address string

	if c.BindAddress != "0.0.0.0" {
		address = c.BindAddress
	}

	return fmt.Sprintf("%s:%d", address, c.Port)
}
