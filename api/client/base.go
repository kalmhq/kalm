package client

import (
	"github.com/casbin/casbin/v2/persist"
	"github.com/kalmhq/kalm/api/rbac"
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

	CanView(client *ClientInfo, scope string, obj string) bool
	CanEdit(client *ClientInfo, scope string, obj string) bool
	CanManage(client *ClientInfo, scope string, obj string) bool
	CanViewNamespace(client *ClientInfo, scope string) bool
	CanEditNamespace(client *ClientInfo, scope string) bool
	CanManageNamespace(client *ClientInfo, scope string) bool
	CanViewCluster(client *ClientInfo) bool
	CanEditCluster(client *ClientInfo) bool
	CanManageCluster(client *ClientInfo) bool

	GetRBACEnforcer() rbac.Enforcer
}

var _ ClientManager = new(StandardClientManager)
var _ ClientManager = new(LocalClientManager)
var _ ClientManager = new(FakeClientManager)

type BaseClientManager struct {
	RBACEnforcer rbac.Enforcer
}

func NewBaseClientManager(adapter persist.Adapter) *BaseClientManager {
	enforcer, err := rbac.NewEnforcer(adapter)

	if err != nil {
		panic(err)
	}

	return &BaseClientManager{RBACEnforcer: enforcer}
}

func (m *BaseClientManager) GetRBACEnforcer() rbac.Enforcer {
	return m.RBACEnforcer
}

func (m *BaseClientManager) CanView(client *ClientInfo, scope string, obj string) bool {
	if m.RBACEnforcer == nil {
		return false
	}

	if m.RBACEnforcer.CanView(ToSafeSubject(client.Email), scope, obj) {
		return true
	}

	for i := range client.Groups {
		if m.RBACEnforcer.CanView(ToSafeSubject(client.Groups[i]), scope, obj) {
			return true
		}
	}

	return false
}

func (m *BaseClientManager) CanEdit(client *ClientInfo, scope string, obj string) bool {
	if m.RBACEnforcer == nil {
		return false
	}

	if m.RBACEnforcer.CanEdit(ToSafeSubject(client.Email), scope, obj) {
		return true
	}

	for i := range client.Groups {
		if m.RBACEnforcer.CanEdit(ToSafeSubject(client.Groups[i]), scope, obj) {
			return true
		}
	}

	return false
}

func (m *BaseClientManager) CanManage(client *ClientInfo, scope string, obj string) bool {
	if m.RBACEnforcer == nil {
		return false
	}

	if m.RBACEnforcer.CanManage(ToSafeSubject(client.Email), scope, obj) {
		return true
	}

	for i := range client.Groups {
		if m.RBACEnforcer.CanManage(ToSafeSubject(client.Groups[i]), scope, obj) {
			return true
		}
	}

	return false
}

func (m *BaseClientManager) CanViewNamespace(client *ClientInfo, scope string) bool {
	if m.RBACEnforcer == nil {
		return false
	}

	if m.RBACEnforcer.CanViewNamespace(ToSafeSubject(client.Email), scope) {
		return true
	}

	for i := range client.Groups {
		if m.RBACEnforcer.CanViewNamespace(ToSafeSubject(client.Groups[i]), scope) {
			return true
		}
	}

	return false
}

func (m *BaseClientManager) CanEditNamespace(client *ClientInfo, scope string) bool {
	if m.RBACEnforcer == nil {
		return false
	}

	if m.RBACEnforcer.CanEditNamespace(ToSafeSubject(client.Email), scope) {
		return true
	}

	for i := range client.Groups {
		if m.RBACEnforcer.CanEditNamespace(ToSafeSubject(client.Groups[i]), scope) {
			return true
		}
	}

	return false
}

func (m *BaseClientManager) CanManageNamespace(client *ClientInfo, scope string) bool {
	if m.RBACEnforcer == nil {
		return false
	}

	if m.RBACEnforcer.CanManageNamespace(ToSafeSubject(client.Email), scope) {
		return true
	}

	for i := range client.Groups {
		if m.RBACEnforcer.CanManageNamespace(ToSafeSubject(client.Groups[i]), scope) {
			return true
		}
	}

	return false
}

func (m *BaseClientManager) CanViewCluster(client *ClientInfo) bool {
	if m.RBACEnforcer == nil {
		return false
	}

	if m.RBACEnforcer.CanViewCluster(ToSafeSubject(client.Email)) {
		return true
	}

	for i := range client.Groups {
		if m.RBACEnforcer.CanViewCluster(ToSafeSubject(client.Groups[i])) {
			return true
		}
	}

	return false
}

func (m *BaseClientManager) CanEditCluster(client *ClientInfo) bool {
	if m.RBACEnforcer == nil {
		return false
	}

	if m.RBACEnforcer.CanEditCluster(ToSafeSubject(client.Email)) {
		return true
	}

	for i := range client.Groups {
		if m.RBACEnforcer.CanEditCluster(ToSafeSubject(client.Groups[i])) {
			return true
		}
	}

	return false
}

func (m *BaseClientManager) CanManageCluster(client *ClientInfo) bool {
	if m.RBACEnforcer == nil {
		return false
	}

	if m.RBACEnforcer.CanManageCluster(ToSafeSubject(client.Email)) {
		return true
	}

	for i := range client.Groups {
		if m.RBACEnforcer.CanManageCluster(ToSafeSubject(client.Groups[i])) {
			return true
		}
	}

	return false
}
