package config

import (
	"encoding/json"
	"fmt"
	"github.com/kalmhq/kalm/api/log"
	"github.com/urfave/cli/v2"
	"os"
	"path/filepath"
)

type Config struct {
	BindAddress                   string
	Port                          int
	PrivilegedLocalhostAccess     bool
	WebhookPort                   int
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

		log.Debug("Using cluster of current context", "definedIn", defaultKubeConfigPath)
	}
}

func (c *Config) DeepCopy() *Config {
	bs, _ := json.Marshal(c)
	var res Config
	_ = json.Unmarshal(bs, &res)
	return &res
}

func (c *Config) Validate() {

}

func (c *Config) Install() {
	log.InitDefaultLogger(c.LogLevel)
	c.Normalize()
	log.Debug("config", "config", c)
	c.Validate()
}

func (c *Config) GetServerAddress() string {
	var address string

	if c.BindAddress != "0.0.0.0" {
		address = c.BindAddress
	}

	return fmt.Sprintf("%s:%d", address, c.Port)
}

func (c *Config) GetWebhookServerAddress() string {
	var address string

	if c.BindAddress != "0.0.0.0" {
		address = c.BindAddress
	}

	return fmt.Sprintf("%s:%d", address, c.WebhookPort)
}
