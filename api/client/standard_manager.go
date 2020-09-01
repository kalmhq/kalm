package client

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/dgrijalva/jwt-go"
	"github.com/kalmhq/kalm/api/auth"
	"github.com/kalmhq/kalm/api/log"
	"github.com/kalmhq/kalm/api/rbac"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	"html/template"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/rest"
	toolscache "k8s.io/client-go/tools/cache"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/tools/clientcmd/api"
	"sigs.k8s.io/controller-runtime/pkg/cache"
	"strings"
	"sync"
)

type StandardClientManager struct {
	*BaseClientManager

	PolicyAdapter *rbac.StringPolicyAdapter

	ClusterConfig *rest.Config

	// Access tokens, roleBindings, applications are rarely changed.
	// It is efficient to hold all roles and access tokens in memory to authorize requests.
	mut          *sync.Mutex
	Applications map[string]*coreV1.Namespace
	AccessTokens map[string]*v1alpha1.AccessToken
	RoleBindings map[string]*v1alpha1.RoleBinding
}

func BuildClusterRolePolicies() string {
	return `
# cluster role policies
p, role_clusterViewer, view, *, *
p, role_clusterEditor, edit, *, *
p, role_clusterOwner, manage, *, *
g, role_clusterEditor, role_clusterViewer
g, role_clusterOwner, role_clusterEditor
`
}

func BuildRolePoliciesForNamespace(name string) string {
	t := template.Must(template.New("policy").Parse(`
# {{ .name }} application role policies
p, role_{{ .name }}Viewer, view, {{ .name }}, *
p, role_{{ .name }}Editor, edit, {{ .name }}, *
p, role_{{ .name }}Owner, manage, {{ .name }}, *
g, role_{{ .name }}Editor, role_{{ .name }}Viewer
g, role_{{ .name }}Owner, role_{{ .name }}Editor
`))

	strBuffer := &strings.Builder{}
	_ = t.Execute(strBuffer, map[string]string{"name": name})

	return strBuffer.String()
}

func (m *StandardClientManager) UpdatePolicies() {
	var sb strings.Builder

	sb.WriteString(BuildClusterRolePolicies())

	for _, application := range m.Applications {
		sb.WriteString(BuildRolePoliciesForNamespace(application.Name))
	}

	for _, accessToken := range m.AccessTokens {
		sb.WriteString(fmt.Sprintf("# policies for access token %s\n", accessToken.Name))
		for _, rule := range accessToken.Spec.Rules {
			sb.WriteString(
				fmt.Sprintf(
					"p, %s, %s, %s, %s\n",
					ToSafeSubject(accessToken.Spec.Subject),
					rule.Verb,
					rule.Namespace,
					rule.Name,
				),
			)
		}
	}

	for _, roleBinding := range m.RoleBindings {
		sb.WriteString(fmt.Sprintf("# policies for rolebinding %s\n", roleBinding.Name))

		var role string

		if roleBinding.Spec.Role == v1alpha1.ClusterRoleViewer ||
			roleBinding.Spec.Role == v1alpha1.ClusterRoleEditor ||
			roleBinding.Spec.Role == v1alpha1.ClusterRoleOwner {
			role = roleBinding.Spec.Role
		} else {
			role = fmt.Sprintf("role_%s%s", roleBinding.Namespace, roleBinding.Spec.Role)
		}

		sb.WriteString(fmt.Sprintf("g, %s, %s\n", ToSafeSubject(roleBinding.Spec.Subject), role))
	}

	m.PolicyAdapter.SetPoliciesString(sb.String())

	if err := m.RBACEnforcer.LoadPolicy(); err != nil {
		// the policy is important. Stale policies can be harmful.
		panic(err)
	}
}

func (m *StandardClientManager) GetDefaultClusterConfig() *rest.Config {
	return m.ClusterConfig
}

func (m *StandardClientManager) GetClientInfoFromToken(tokenString string) (*ClientInfo, error) {
	accessToken, ok := m.AccessTokens[v1alpha1.GetAccessTokenNameFromToken(tokenString)]

	if !ok {
		return nil, errors.NewUnauthorized("access token not exist")
	}

	return &ClientInfo{
		Cfg:           m.ClusterConfig,
		Name:          accessToken.Name,
		Email:         fmt.Sprintf("AccessToken-%s", accessToken.Name),
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
	policyAdapter := rbac.NewStringPolicyAdapter(``)

	manager := &StandardClientManager{
		BaseClientManager: NewBaseClientManager(policyAdapter),
		PolicyAdapter:     policyAdapter,
		ClusterConfig:     cfg,
		mut:               &sync.Mutex{},
		Applications:      make(map[string]*coreV1.Namespace),
		AccessTokens:      make(map[string]*v1alpha1.AccessToken),
		RoleBindings:      make(map[string]*v1alpha1.RoleBinding),
	}

	newResourcesWatcher(cfg, manager)

	return manager
}

func newResourcesWatcher(cfg *rest.Config, manager *StandardClientManager) {
	informerCache, err := cache.New(cfg, cache.Options{})

	if err != nil {
		log.Error(err, "new cache error")
		panic(err)
	}

	if informer, err := informerCache.GetInformer(context.Background(), &coreV1.Namespace{}); err == nil {
		informer.AddEventHandler(toolscache.ResourceEventHandlerFuncs{
			AddFunc: func(obj interface{}) {
				manager.mut.Lock()
				defer manager.mut.Unlock()
				if namespace, ok := obj.(*coreV1.Namespace); ok {
					manager.Applications[namespace.Name] = namespace
					manager.UpdatePolicies()
				}
			},
			DeleteFunc: func(obj interface{}) {
				manager.mut.Lock()
				defer manager.mut.Unlock()
				if namespace, ok := obj.(*coreV1.Namespace); ok {
					delete(manager.Applications, namespace.Name)
					manager.UpdatePolicies()
				}
			},
			UpdateFunc: func(oldObj, obj interface{}) {
				manager.mut.Lock()
				defer manager.mut.Unlock()
				if namespace, ok := obj.(*coreV1.Namespace); ok {
					manager.Applications[namespace.Name] = namespace
					manager.UpdatePolicies()
				}
			},
		})
	} else {
		log.Error(err, "get informer error")
		panic(err)
	}

	if informer, err := informerCache.GetInformer(context.Background(), &v1alpha1.RoleBinding{}); err == nil {
		informer.AddEventHandler(toolscache.ResourceEventHandlerFuncs{
			AddFunc: func(obj interface{}) {
				manager.mut.Lock()
				defer manager.mut.Unlock()
				if roleBinding, ok := obj.(*v1alpha1.RoleBinding); ok {
					manager.RoleBindings[getNamespacedName(roleBinding.ObjectMeta)] = roleBinding
					manager.UpdatePolicies()
				}
			},
			DeleteFunc: func(obj interface{}) {
				manager.mut.Lock()
				defer manager.mut.Unlock()
				if roleBinding, ok := obj.(*v1alpha1.RoleBinding); ok {
					delete(manager.RoleBindings, getNamespacedName(roleBinding.ObjectMeta))
					manager.UpdatePolicies()
				}
			},
			UpdateFunc: func(oldObj, obj interface{}) {
				manager.mut.Lock()
				defer manager.mut.Unlock()
				if roleBinding, ok := obj.(*v1alpha1.RoleBinding); ok {
					manager.RoleBindings[getNamespacedName(roleBinding.ObjectMeta)] = roleBinding
					manager.UpdatePolicies()
				}
			},
		})
	} else {
		log.Error(err, "get informer error")
		panic(err)
	}

	if informer, err := informerCache.GetInformer(context.Background(), &v1alpha1.AccessToken{}); err == nil {
		informer.AddEventHandler(toolscache.ResourceEventHandlerFuncs{
			AddFunc: func(obj interface{}) {
				manager.mut.Lock()
				defer manager.mut.Unlock()
				if accessToken, ok := obj.(*v1alpha1.AccessToken); ok {
					manager.AccessTokens[accessToken.Name] = accessToken
					manager.UpdatePolicies()
				}
			},
			DeleteFunc: func(obj interface{}) {
				manager.mut.Lock()
				defer manager.mut.Unlock()
				if accessToken, ok := obj.(*v1alpha1.AccessToken); ok {
					delete(manager.AccessTokens, accessToken.Name)
					manager.UpdatePolicies()
				}
			},
			UpdateFunc: func(oldObj, obj interface{}) {
				manager.mut.Lock()
				defer manager.mut.Unlock()
				if accessToken, ok := obj.(*v1alpha1.AccessToken); ok {
					manager.AccessTokens[accessToken.Name] = accessToken
					manager.UpdatePolicies()
				}
			},
		})
	} else {
		log.Error(err, "get informer error")
		panic(err)
	}
}

func getNamespacedName(metaObj metaV1.ObjectMeta) string {
	return fmt.Sprintf("%s-%s", metaObj.Namespace, metaObj.Name)
}
