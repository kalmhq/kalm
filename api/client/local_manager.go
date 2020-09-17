package client

import (
	"fmt"
	"github.com/kalmhq/kalm/api/rbac"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/client-go/rest"
)

type LocalClientManager struct {
	*BaseClientManager
	ClusterConfig *rest.Config
}

const localhostAdminUser = "admin-via-localhost"

func (m *LocalClientManager) GetDefaultClusterConfig() *rest.Config {
	return m.ClusterConfig
}

func (m *LocalClientManager) GetClientInfoFromToken(_ string) (*ClientInfo, error) {
	return nil, errors.NewUnauthorized("auth via token is not allowed in local client manager")
}

func (m *LocalClientManager) SetImpersonation(_ *ClientInfo, _ string) {
}

func (m *LocalClientManager) GetClientInfoFromContext(_ echo.Context) (*ClientInfo, error) {
	return &ClientInfo{
		Cfg:           m.ClusterConfig,
		Name:          localhostAdminUser,
		Email:         localhostAdminUser,
		EmailVerified: false,
		Groups:        []string{},
	}, nil
}

func NewLocalClientManager(cfg *rest.Config) *LocalClientManager {
	return &LocalClientManager{
		BaseClientManager: NewBaseClientManager(rbac.NewStringPolicyAdapter(
			fmt.Sprintf(`
p, role_admin, manage, *, *
p, role_admin, view, *, *
p, role_admin, edit, *, *
g, %s, role_admin
`, ToSafeSubject(localhostAdminUser, v1alpha1.SubjectTypeUser)),
		)),
		ClusterConfig: cfg,
	}
}
