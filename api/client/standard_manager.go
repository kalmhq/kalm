package client

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/dgrijalva/jwt-go"
	"github.com/kalmhq/kalm/api/auth"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/tools/clientcmd/api"
	"sync"
)

type StandardClientManager struct {
	ClusterConfig *rest.Config

	// Access tokens are rarely created.
	// Hold all access tokens in memory
	// This is efficient
	AccessTokens *sync.Map
}

func (m *StandardClientManager) GetDefaultClusterConfig() *rest.Config {
	return m.ClusterConfig
}

func (m *StandardClientManager) GetClientInfoFromToken(tokenString string) (*ClientInfo, error) {
	accessToken, ok := m.AccessTokens.Load(v1alpha1.GetAccessTokenNameFromToken(tokenString))

	if !ok {
		return nil, errors.NewUnauthorized("access token not exist")
	}

	ac, _ := accessToken.(*v1alpha1.AccessToken)

	return &ClientInfo{
		Cfg:           m.ClusterConfig,
		Name:          ac.Name,
		Email:         fmt.Sprintf("AccessToken-%s", ac.Name),
		EmailVerified: false,
		Groups:        []string{},
	}, nil
}

func (m *StandardClientManager) GetConfigForClientRequestContext(c echo.Context) (*ClientInfo, error) {
	// TODO Impersonate

	// If the Authorization Header is not empty, use the bearer token as k8s token.
	if token := extractAuthTokenFromClientRequestContext(c); token != "" {
		return m.GetClientInfoFromToken(token)
	}

	// And the kalm-sso-userinfo header is not empty.
	// This header will be removed at ingress route level. Only auth proxy can set this header, So it's safe to trust this value.
	if c.Request().Header.Get("Kalm-Sso-Userinfo") != "" {
		claimsBytes, err := base64.RawStdEncoding.DecodeString(c.Request().Header.Get("Kalm-Sso-Userinfo"))

		if err != nil {
			return nil, err
		}

		var clientInfo ClientInfo

		err = json.Unmarshal(claimsBytes, &clientInfo)

		if err != nil {
			return nil, err
		}

		// Use cluster config permission
		// TODO permissions based on group and email
		// For current version, anyone that is verified through sso is treated as an admin.
		clientInfo.Cfg = m.ClusterConfig

		return &clientInfo, nil
	}

	// Shouldn't be able to reach here
	return nil, errors.NewUnauthorized("")
}

func (m *StandardClientManager) buildClientConfigWithAuthInfo(authInfo *api.AuthInfo) (*rest.Config, error) {
	clientConfig := buildCmdConfig(authInfo, m.ClusterConfig)

	cfg, err := clientConfig.ClientConfig()

	if err != nil {
		return nil, err
	}

	return cfg, nil
}

func buildCmdConfig(authInfo *api.AuthInfo, cfg *rest.Config) clientcmd.ClientConfig {
	cmdCfg := api.NewConfig()
	cmdCfg.Clusters[DefaultCmdConfigName] = &api.Cluster{
		Server:                   cfg.Host,
		CertificateAuthority:     cfg.TLSClientConfig.CAFile,
		CertificateAuthorityData: cfg.TLSClientConfig.CAData,
		InsecureSkipTLSVerify:    cfg.TLSClientConfig.Insecure,
	}
	cmdCfg.AuthInfos[DefaultCmdConfigName] = authInfo
	cmdCfg.Contexts[DefaultCmdConfigName] = &api.Context{
		Cluster:  DefaultCmdConfigName,
		AuthInfo: DefaultCmdConfigName,
	}
	cmdCfg.CurrentContext = DefaultCmdConfigName

	return clientcmd.NewDefaultClientConfig(
		*cmdCfg,
		&clientcmd.ConfigOverrides{},
	)
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

// Since the token is validated by api server, so we don't need to valid the token again here.
func tryToParseEntityFromToken(tokenString string) string {
	if tokenString == "" {
		return "unknown"
	}

	token, _, err := new(jwt.Parser).ParseUnverified(tokenString, jwt.MapClaims{})

	if err != nil {
		return "token"
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok {
		return claims["sub"].(string)
	}

	return "token"
}

func NewStandardClientManager(cfg *rest.Config) *StandardClientManager {
	return &StandardClientManager{
		ClusterConfig: cfg,
		AccessTokens:  &sync.Map{},
	}
}
