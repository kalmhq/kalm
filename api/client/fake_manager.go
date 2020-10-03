package client

import (
	"github.com/kalmhq/kalm/api/rbac"
	"github.com/labstack/echo/v4"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/client-go/rest"
	"strings"
)

// For test only
type FakeClientManager struct {
	*BaseClientManager
	ClusterConfig *rest.Config
}

func (m *FakeClientManager) GetDefaultClusterConfig() *rest.Config {
	return m.ClusterConfig
}

func (m *FakeClientManager) SetImpersonation(_ *ClientInfo, _ string) {
}

func (m *FakeClientManager) GetClientInfoFromToken(token string) (*ClientInfo, error) {
	if token == "" {
		return nil, errors.NewUnauthorized("No token found in request header")
	}

	email, groups := parseFakeToken(token)

	return &ClientInfo{
		Cfg:           m.ClusterConfig,
		Name:          email,
		Email:         email,
		EmailVerified: true,
		Groups:        groups,
	}, nil
}

func (m *FakeClientManager) GetClientInfoFromContext(c echo.Context) (*ClientInfo, error) {
	token := extractAuthTokenFromClientRequestContext(c)
	return m.GetClientInfoFromToken(token)
}

func ToFakeToken(email string, roles ...string) string {
	var sb strings.Builder
	sb.WriteString("email=")
	sb.WriteString(email)
	sb.WriteString(" groups=")
	for i := range roles {
		sb.WriteString(roles[i])
		if i < len(roles)-1 {
			sb.WriteString(",")
		}
	}
	return sb.String()
}

func parseFakeToken(token string) (email string, roles []string) {
	defer func() {
		if r := recover(); r != nil {
			email = "empty"
			roles = []string{}
		}
	}()

	token = strings.TrimPrefix(token, "email=")
	idx := strings.Index(token, " ")
	email = token[:idx]
	rolesString := token[idx+1+len("groups="):]

	if len(rolesString) == 0 {
		return
	}

	roles = strings.Split(token[idx+1+len("groups="):], ",")
	return
}

func NewFakeClientManager(cfg *rest.Config, policies string) *FakeClientManager {
	return &FakeClientManager{
		BaseClientManager: NewBaseClientManager(rbac.NewStringPolicyAdapter(policies)),
		ClusterConfig:     cfg,
	}
}
