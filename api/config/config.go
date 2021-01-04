package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/kalmhq/kalm/api/log"
	"github.com/urfave/cli/v2"
	"go.uber.org/zap"
)

type Config struct {
	BindAddress                   string
	Port                          int
	PrivilegedLocalhostAccess     bool
	Verbose                       bool
	KubernetesApiServerAddress    string
	KubernetesApiServerCAFilePath string
	KubeConfigPath                string
	KalmMode                      string
	ClusterBaseDNSDomain          string
	ClusterBaseAppDomain          string
	CorsAllowedOrigins            cli.StringSlice

	EnableAdminServerDebugRoutes bool
}

type BaseDomainConfig struct {
	DNSDomain string
	AppDomain string
}

func (c *Config) DomainConfig() BaseDomainConfig {
	return BaseDomainConfig{
		DNSDomain: c.ClusterBaseDNSDomain,
		AppDomain: c.ClusterBaseAppDomain,
	}
}

// Built-time env
var (
	GIT_VERSION string
	GIT_COMMIT  string
	BUILD_TIME  string
	PLATFORM    string
	GO_VERSION  string
)

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

		log.Debug("Using cluster of current context", zap.String("definedIn", defaultKubeConfigPath))
	}
}

func (c *Config) DeepCopy() *Config {
	bs, _ := json.Marshal(c)
	var res Config
	_ = json.Unmarshal(bs, &res)
	return &res
}

func (c *Config) IsInCluster() bool {
	return c.KubernetesApiServerAddress == "" && c.KubeConfigPath == ""
}

func (c *Config) Validate() {
}

func (c *Config) Install() {
	c.Normalize()
	log.InitDefaultLogger(c.Verbose)
	log.Debug("config", zap.Any("config", c))
	c.Validate()
}

func (c *Config) GetServerAddress() string {
	var address string

	if c.BindAddress != "0.0.0.0" {
		address = c.BindAddress
	}

	return fmt.Sprintf("%s:%d", address, c.Port)
}
