package client

import (
	"regexp"
	"strings"

	"github.com/kalmhq/kalm/api/rbac"
	"github.com/labstack/echo/v4"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/client-go/rest"
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

	var re = regexp.MustCompile(`email=(.*) groups=(.*)`)
	match := re.FindStringSubmatch(token)

	if match == nil {
		return "", nil
	}

	email = match[1]
	rolesString := match[2]

	if len(rolesString) == 0 {
		return
	}

	roles = strings.Split(rolesString, ",")
	return
}

func NewFakeClientManager(cfg *rest.Config, policies string) *FakeClientManager {
	return &FakeClientManager{
		BaseClientManager: NewBaseClientManager(rbac.NewStringPolicyAdapter(policies)),
		ClusterConfig:     cfg,
	}
}
