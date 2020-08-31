package client

import (
	"github.com/labstack/echo/v4"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/client-go/rest"
)

type LocalClientManager struct {
	ClusterConfig *rest.Config
}

func (m *LocalClientManager) GetDefaultClusterConfig() *rest.Config {
	return m.ClusterConfig
}

func (m *LocalClientManager) GetClientInfoFromToken(token string) (*ClientInfo, error) {
	return nil, errors.NewUnauthorized("auth via token is not allowed in local client manager")
}

func (m *LocalClientManager) GetConfigForClientRequestContext(c echo.Context) (*ClientInfo, error) {
	return &ClientInfo{
		Cfg:           m.ClusterConfig,
		Name:          "localhost",
		Email:         "Unknown",
		EmailVerified: false,
		Groups:        []string{},
	}, nil
}

func NewLocalClientManager(cfg *rest.Config) *LocalClientManager {
	return &LocalClientManager{
		ClusterConfig: cfg,
	}
}
