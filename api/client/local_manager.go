package client

import (
	"fmt"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/client-go/rest"
)

type LocalClientManager struct {
	*StandardClientManager
}

const localhostAdminUser = "admin-via-localhost"

func (m *LocalClientManager) GetDefaultClusterConfig() *rest.Config {
	return m.ClusterConfig
}

func (m *LocalClientManager) GetClientInfoFromToken(_ string) (*ClientInfo, error) {
	return nil, errors.NewUnauthorized("auth via token is not allowed in local client manager")
}

func (m *LocalClientManager) GetClientInfoFromContext(c echo.Context) (*ClientInfo, error) {
	clientInfo := &ClientInfo{
		Cfg:           m.ClusterConfig,
		Name:          localhostAdminUser,
		Email:         localhostAdminUser,
		EmailVerified: false,
		Groups:        []string{},
	}

	m.SetImpersonation(clientInfo, c.Request().Header.Get("Kalm-Impersonation"))

	return clientInfo, nil
}

func NewLocalClientManager(cfg *rest.Config) *LocalClientManager {
	return &LocalClientManager{
		StandardClientManager: NewStandardClientManager(cfg, fmt.Sprintf(`
p, role_admin, manage, *, *
p, role_admin, view, *, *
p, role_admin, edit, *, *
g, %s, role_admin
`, ToSafeSubject(localhostAdminUser, v1alpha1.SubjectTypeUser))),
	}
}
