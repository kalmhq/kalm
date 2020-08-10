package client

import (
	"encoding/base64"
	"encoding/json"
	"github.com/dgrijalva/jwt-go"
	"github.com/kalmhq/kalm/api/auth"
	"github.com/kalmhq/kalm/api/config"
	"github.com/kalmhq/kalm/api/errors"
	"github.com/labstack/echo/v4"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/tools/clientcmd/api"
	"strings"
)

const (
	// Default cluster/context/auth name to be set in clientcmd config
	DefaultCmdConfigName = "default"
)

type ClientManager struct {
	Config        *config.Config
	ClusterConfig *rest.Config
}

func (m *ClientManager) IsInCluster() bool {
	return m.Config.KubernetesApiServerAddress == "" && m.Config.KubeConfigPath == ""
}

func BuildCmdConfig(authInfo *api.AuthInfo, cfg *rest.Config) clientcmd.ClientConfig {
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

func (m *ClientManager) IsAuthInfoWorking(authInfo *api.AuthInfo) error {
	cfg, err := m.BuildClientConfigWithAuthInfo(authInfo)
	if err != nil {
		return err
	}

	client, err := kubernetes.NewForConfig(cfg)
	if err != nil {
		return err
	}

	_, err = client.ServerVersion()
	return err
}

func (m *ClientManager) initClusterClientConfiguration() (err error) {
	var cfg *rest.Config

	if m.IsInCluster() {
		cfg, err = rest.InClusterConfig()
	} else {
		if m.Config.KubernetesApiServerAddress != "" {
			TLSClientConfig := rest.TLSClientConfig{}

			if m.Config.KubernetesApiServerCAFilePath != "" {
				TLSClientConfig.CAFile = m.Config.KubernetesApiServerCAFilePath
			}

			cfg = &rest.Config{
				Host:            m.Config.KubernetesApiServerAddress,
				TLSClientConfig: TLSClientConfig,
			}
		} else if m.Config.KubeConfigPath != "" {
			cfg, err = clientcmd.NewNonInteractiveDeferredLoadingClientConfig(
				&clientcmd.ClientConfigLoadingRules{ExplicitPath: m.Config.KubeConfigPath},
				&clientcmd.ConfigOverrides{}).ClientConfig()
		}
	}

	if err != nil {
		return err
	}

	m.ClusterConfig = cfg
	return nil
}

func (m *ClientManager) BuildClientConfigWithAuthInfo(authInfo *api.AuthInfo) (*rest.Config, error) {
	clientConfig := BuildCmdConfig(authInfo, m.ClusterConfig)

	cfg, err := clientConfig.ClientConfig()
	if err != nil {
		return nil, err
	}

	return cfg, nil
}

func ExtractAuthInfoFromClientRequestContext(c echo.Context) *api.AuthInfo {
	req := c.Request()
	authHeader := req.Header.Get(echo.HeaderAuthorization)
	token := auth.ExtractTokenFromHeader(authHeader)
	if token != "" {
		return &api.AuthInfo{Token: token}
	}
	return nil
}

type ClientInfo struct {
	Cfg               *rest.Config `json:"-"`
	Name              string       `json:"name"`
	PreferredUsername string       `json:"preferred_username"`
	Email             string       `json:"email"`
	EmailVerified     bool         `json:"email_verified"`
	Groups            []string     `json:"groups"`
}

func (m *ClientManager) GetConfigForClientRequestContext(c echo.Context) (*ClientInfo, error) {
	// TODO Impersonate

	// If the Authorization Header is not empty, use the bearer token as k8s token.
	authInfo := ExtractAuthInfoFromClientRequestContext(c)
	if authInfo != nil {
		cfg, err := m.BuildClientConfigWithAuthInfo(authInfo)

		if err != nil {
			return nil, err
		}

		return &ClientInfo{
			Cfg:           cfg,
			Name:          tryToParseEntityFromToken(authInfo.Token),
			Email:         "Unknown",
			EmailVerified: false,
			Groups:        []string{},
		}, nil
	}

	// The request comes from internal envoy proxy (more precise, from ingress gateway).
	// And the kalm-sso-userinfo header is not empty.
	if c.Request().Header.Get("X-Envoy-Internal") == "true" && c.Request().Header.Get("Kalm-Sso-Userinfo") != "" {
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

	// If the request is from localhost
	// 	 Case #1: localhost development
	//   Case #2: kubectl port-forwrd (https://github.com/kubernetes/kubernetes/blob/6ce9e71cd57d4aa6c932aabddf4129f173b9d710/pkg/kubelet/dockershim/docker_streaming_others.go#L31-L86)
	// Use cluster config permission

	if strings.HasPrefix(c.Request().RemoteAddr, "127.0.0.1") || strings.HasPrefix(c.Request().RemoteAddr, "[::1]") {
		var name string

		if m.IsInCluster() {
			name = "localhost(InCluster)"
		} else {
			name = "localhost"
		}

		return &ClientInfo{
			Cfg:           m.ClusterConfig,
			Name:          name,
			Email:         "Unknown",
			EmailVerified: false,
			Groups:        []string{},
		}, nil
	}

	// Shouldn't be able to reach here
	return nil, errors.NewUnauthorized("")
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

func NewClientManager(config *config.Config) *ClientManager {
	m := &ClientManager{
		Config: config,
	}

	err := m.initClusterClientConfiguration()

	if err != nil {
		panic(err)
	}

	return m
}
