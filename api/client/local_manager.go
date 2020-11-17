package client

import (
	"fmt"

	"github.com/kalmhq/kalm/api/log"
	"github.com/kalmhq/kalm/api/rbac"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
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

func (m *LocalClientManager) SetImpersonation(clientInfo *ClientInfo, rawImpersonation string) {
	if rawImpersonation != "" && m.CanManageCluster(clientInfo) {
		impersonation, impersonationType, err := parseImpersonationString(rawImpersonation)

		if err == nil {
			clientInfo.Impersonation = impersonation
			clientInfo.ImpersonationType = impersonationType
		} else {
			log.Error("parse impersonation raw string failed", zap.Error(err))
		}
	}
}

func (m *LocalClientManager) GetClientInfoFromContext(c echo.Context) (*ClientInfo, error) {
	clientInfo := &ClientInfo{
		Cfg:           m.ClusterConfig,
		Name:          localhostAdminUser,
		Email:         localhostAdminUser,
		EmailVerified: false,
		Tenant:        "global",
		Tenants:       []string{"global"},
		Groups:        []string{},
	}

	m.SetImpersonation(clientInfo, c.Request().Header.Get("Kalm-Impersonation"))

	return clientInfo, nil
}

func NewLocalClientManager(cfg *rest.Config) *LocalClientManager {
	return &LocalClientManager{
		BaseClientManager: NewBaseClientManager(rbac.NewStringPolicyAdapter(
			fmt.Sprintf(`
p, role_admin, manage, */*, */*
p, role_admin, view, */*, */*
p, role_admin, edit, */*, */*
g, %s, role_admin
`, ToSafeSubject(localhostAdminUser, v1alpha1.SubjectTypeUser)),
		)),
		ClusterConfig: cfg,
	}
}
