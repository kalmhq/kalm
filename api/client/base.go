package client

import (
	"github.com/labstack/echo/v4"
	"k8s.io/client-go/rest"
)

const (
	// Default cluster/context/auth name to be set in clientcmd config
	DefaultCmdConfigName = "default"
)

type ClientInfo struct {
	Cfg               *rest.Config `json:"-"`
	Name              string       `json:"name"`
	PreferredUsername string       `json:"preferred_username"`
	Email             string       `json:"email"`
	EmailVerified     bool         `json:"email_verified"`
	Groups            []string     `json:"groups"`
}

type ClientManager interface {
	GetDefaultClusterConfig() *rest.Config
	GetClientInfoFromToken(token string) (*ClientInfo, error)
	GetConfigForClientRequestContext(c echo.Context) (*ClientInfo, error)
}

var _ ClientManager = new(StandardClientManager)
var _ ClientManager = new(LocalClientManager)
