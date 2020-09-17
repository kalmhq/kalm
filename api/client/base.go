package client

import (
	"github.com/casbin/casbin/v2/persist"
	"github.com/kalmhq/kalm/api/auth"
	"github.com/kalmhq/kalm/api/rbac"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	"k8s.io/client-go/rest"
	"reflect"
	"strings"
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
	Impersonation     string       `json:"impersonation"`
	ImpersonationType string       `json:"impersonationType"`
}

type ClientManager interface {
	GetDefaultClusterConfig() *rest.Config
	GetClientInfoFromToken(token string) (*ClientInfo, error)
	GetClientInfoFromContext(c echo.Context) (*ClientInfo, error)
	SetImpersonation(client *ClientInfo, impersonation string)

	Can(client *ClientInfo, verb, scope, obj string) bool
	CanView(client *ClientInfo, scope string, obj string) bool
	CanEdit(client *ClientInfo, scope string, obj string) bool
	CanManage(client *ClientInfo, scope string, obj string) bool
	CanViewNamespace(client *ClientInfo, scope string) bool
	CanEditNamespace(client *ClientInfo, scope string) bool
	CanManageNamespace(client *ClientInfo, scope string) bool
	CanViewCluster(client *ClientInfo) bool
	CanEditCluster(client *ClientInfo) bool
	CanManageCluster(client *ClientInfo) bool

	// special resources
	CanOperateHttpRoute(c *ClientInfo, action string, route *resources.HttpRoute) bool
	PermissionsGreaterThanOrEqualAccessToken(c *ClientInfo, accessToken *resources.AccessToken) bool
	CanManageRoleBinding(c *ClientInfo, roleBinding *v1alpha1.RoleBinding) bool

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

func (m *BaseClientManager) wrapper(client *ClientInfo, authFunc interface{}, args ...interface{}) bool {
	if m.RBACEnforcer == nil {
		return false
	}

	values := make([]reflect.Value, len(args)+1)

	for i := 0; i < len(args); i++ {
		values[i+1] = reflect.ValueOf(args[i])
	}

	fn := reflect.ValueOf(authFunc)

	if client.Impersonation != "" {
		values[0] = reflect.ValueOf(ToSafeSubject(client.Impersonation, client.ImpersonationType))
		return fn.Call(values)[0].Interface().(bool)
	}

	values[0] = reflect.ValueOf(ToSafeSubject(client.Email, v1alpha1.SubjectTypeUser))
	if fn.Call(values)[0].Interface().(bool) {
		return true
	}

	for i := range client.Groups {
		values[0] = reflect.ValueOf(ToSafeSubject(client.Groups[i], v1alpha1.SubjectTypeGroup))

		if fn.Call(values)[0].Interface().(bool) {
			return true
		}
	}

	return false
}

func (m *BaseClientManager) Can(client *ClientInfo, action, scope string, obj string) bool {
	return m.wrapper(client, m.RBACEnforcer.Can, action, scope, obj)
}

func (m *BaseClientManager) CanView(client *ClientInfo, scope string, obj string) bool {
	return m.wrapper(client, m.RBACEnforcer.CanView, scope, obj)
}

func (m *BaseClientManager) CanEdit(client *ClientInfo, scope string, obj string) bool {
	return m.wrapper(client, m.RBACEnforcer.CanEdit, scope, obj)
}

func (m *BaseClientManager) CanManage(client *ClientInfo, scope string, obj string) bool {
	return m.wrapper(client, m.RBACEnforcer.CanManage, scope, obj)
}

func (m *BaseClientManager) CanViewNamespace(client *ClientInfo, scope string) bool {
	return m.wrapper(client, m.RBACEnforcer.CanViewNamespace, scope)
}

func (m *BaseClientManager) CanEditNamespace(client *ClientInfo, scope string) bool {
	return m.wrapper(client, m.RBACEnforcer.CanEditNamespace, scope)
}

func (m *BaseClientManager) CanManageNamespace(client *ClientInfo, scope string) bool {
	return m.wrapper(client, m.RBACEnforcer.CanManageNamespace, scope)
}

func (m *BaseClientManager) CanViewCluster(client *ClientInfo) bool {
	return m.wrapper(client, m.RBACEnforcer.CanViewCluster)
}

func (m *BaseClientManager) CanEditCluster(client *ClientInfo) bool {
	return m.wrapper(client, m.RBACEnforcer.CanEditCluster)
}

func (m *BaseClientManager) CanManageCluster(client *ClientInfo) bool {
	return m.wrapper(client, m.RBACEnforcer.CanManageCluster)
}

func (m *BaseClientManager) PermissionsGreaterThanOrEqualAccessToken(c *ClientInfo, accessToken *resources.AccessToken) bool {
	policies := GetPoliciesFromAccessToken(accessToken)

	for _, policy := range policies {
		if !m.Can(c, policy[1], policy[2], policy[3]) {
			return false
		}
	}

	return true
}

func (m *BaseClientManager) CanOperateHttpRoute(c *ClientInfo, action string, route *resources.HttpRoute) bool {
	for _, dest := range route.HttpRouteSpec.Destinations {
		parts := strings.Split(dest.Host, ".")

		if len(parts) == 0 {
			return false
		}

		var ns string
		if len(parts) == 1 {
			ns = route.Namespace
		} else {
			ns = parts[1]
		}

		if action == "view" {
			if !m.CanViewNamespace(c, ns) {
				return false
			}
		} else if action == "edit" {
			if !m.CanEditNamespace(c, ns) {
				return false
			}
		}
	}

	return true
}
func (m *BaseClientManager) CanManageRoleBinding(c *ClientInfo, roleBinding *v1alpha1.RoleBinding) bool {
	switch roleBinding.Spec.Role {
	case v1alpha1.ClusterRoleViewer, v1alpha1.ClusterRoleEditor, v1alpha1.ClusterRoleOwner:
		return m.CanManageCluster(c)
	default:
		return m.CanManageNamespace(c, roleBinding.Namespace)
	}
}

func extractAuthTokenFromClientRequestContext(c echo.Context) string {
	req := c.Request()

	authHeader := req.Header.Get(echo.HeaderAuthorization)
	token := auth.ExtractTokenFromHeader(authHeader)

	if token != "" {
		return token
	}

	return ""
}
