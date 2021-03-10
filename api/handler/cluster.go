package handler

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"sync"

	"github.com/google/uuid"
	"github.com/kalmhq/kalm/api/config"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/api/utils"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/kalmhq/kalm/controller/controllers"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/version"
	"k8s.io/client-go/kubernetes"
)

type ClusterInfo struct {
	Version           string        `json:"version"`
	IngressIP         string        `json:"ingressIP"`
	IngressHostname   string        `json:"ingressHostname"`
	IsProduction      bool          `json:"isProduction"`
	HttpPort          *int          `json:"httpPort"`
	HttpsPort         *int          `json:"httpsPort"`
	TLSPort           *int          `json:"tlsPort"`
	CanBeInitialized  bool          `json:"canBeInitialized"`
	KubernetesVersion *version.Info `json:"kubernetesVersion"`
	KalmVersion       *version.Info `json:"kalmVersion"`
	ClusterName       string        `json:"clusterName"`
}

var KubernetesVersion *version.Info
var KalmVersion *version.Info

func init() {
	KalmVersion = &version.Info{
		GitCommit:  config.GIT_COMMIT,
		GitVersion: config.GIT_VERSION,
		Platform:   config.PLATFORM,
		GoVersion:  config.GO_VERSION,
		BuildDate:  config.BUILD_TIME,
	}
}

func isPrivateIP(ip string) bool {
	parts := strings.Split(ip, ".")
	if len(parts) != 4 {
		return false
	}

	if parts[0] == "10" || parts[0] == "127" || (parts[0] == "192" && parts[1] == "168") {
		return true
	}

	if parts[0] == "172" {
		part2, err := strconv.ParseInt(parts[1], 0, 0)

		if err != nil {
			return false
		}

		return part2 >= 16 && part2 <= 31

	}

	return false
}

func (h *ApiHandler) getClusterInfo(c echo.Context) *ClusterInfo {
	info := &ClusterInfo{}

	httpPort := 80
	info.HttpPort = &httpPort

	httpsPort := 443
	info.HttpsPort = &httpsPort

	tlsPort := 15443
	info.TLSPort = &tlsPort

	var ingressService coreV1.Service
	err := h.resourceManager.Get("istio-system", "istio-ingressgateway", &ingressService)

	if err == nil {
		if len(ingressService.Status.LoadBalancer.Ingress) > 0 {
			info.IngressIP = ingressService.Status.LoadBalancer.Ingress[0].IP
			info.IngressHostname = ingressService.Status.LoadBalancer.Ingress[0].Hostname
		}

		if info.IngressIP != "" && !isPrivateIP(info.IngressIP) {
			info.IsProduction = true
		}
	}

	info.ClusterName = os.Getenv("KALM_CLUSTER_NAME")

	var certNotFound, routeNotFound, ssoNotFound bool

	wg := sync.WaitGroup{}
	wg.Add(1)
	go func() {
		defer wg.Done()
		certNotFound = errors.IsNotFound(h.resourceManager.Get(
			"",
			KalmRouteCertName,
			&v1alpha1.HttpsCert{},
		))
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		routeNotFound = errors.IsNotFound(h.resourceManager.Get(
			controllers.KALM_DEX_NAMESPACE,
			KalmRouteName,
			&v1alpha1.HttpRoute{},
		))
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		ssoNotFound = errors.IsNotFound(h.resourceManager.Get(
			controllers.KALM_DEX_NAMESPACE,
			resources.SSO_NAME,
			&v1alpha1.SingleSignOnConfig{},
		))
	}()

	wg.Wait()

	if info.IsProduction {
		info.CanBeInitialized = certNotFound && routeNotFound && ssoNotFound
	} else {
		info.CanBeInitialized = routeNotFound && ssoNotFound
	}

	k8sClient, err := kubernetes.NewForConfig(getCurrentUser(c).Cfg)
	if err != nil {
		panic(err)
	}

	if KubernetesVersion == nil {
		v, err := k8sClient.ServerVersion()

		if err == nil {
			info.Version = v.GitVersion
			info.KubernetesVersion = v
		}
	} else {
		info.Version = KubernetesVersion.GitVersion
		info.KubernetesVersion = KubernetesVersion
	}

	info.KalmVersion = KalmVersion

	if !h.clientManager.CanViewCluster(getCurrentUser(c)) {
		info.IngressHostname = ""
		info.IngressIP = ""
	}

	return info
}

func (h *ApiHandler) handleExtraInfo(c echo.Context) error {
	isLocalMode := h.KalmMode == v1alpha1.KalmModeLocal

	return c.JSON(200, map[string]interface{}{
		"isFrontendMembersManagementEnabled":          isLocalMode,
		"isFrontendComponentSchedulingFeatureEnabled": isLocalMode,
		"isFrontendSSOPageEnabled":                    isLocalMode,
	})
}

func (h *ApiHandler) handleClusterInfo(c echo.Context) error {
	if !h.clientManager.CanViewCluster(getCurrentUser(c)) {
		return resources.NoClusterViewerRoleError
	}

	return c.JSON(200, h.getClusterInfo(c))
}

const (
	KalmRouteCertName         = "kalm-cert"
	KalmRouteName             = "kalm-route"
	KalmProtectedEndpointName = "kalm"
)

type SetupClusterBody struct {
	Domain string `json:"domain"`
	Issuer string `json:"issuer"`
}

type TemporaryAdmin struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type SetupClusterResponse struct {
	Cert          *resources.HttpsCert `json:"cert"`
	Route         *resources.HttpRoute `json:"route"`
	SSO           *resources.SSOConfig `json:"sso"`
	TemporaryUser *TemporaryAdmin      `json:"temporaryAdmin"`
	ClusterInfo   *ClusterInfo         `json:"clusterInfo"`
}

func (h *ApiHandler) handleInitializeCluster(c echo.Context) (err error) {
	currentUser := getCurrentUser(c)
	h.MustCanManageCluster(currentUser)

	clusterInfo := h.getClusterInfo(c)

	if !clusterInfo.CanBeInitialized {
		return fmt.Errorf("The cluster is already initialized")
	}

	var body SetupClusterBody

	if err := c.Bind(&body); err != nil {
		return err
	}

	route := &resources.HttpRoute{
		HttpRouteSpec: &v1alpha1.HttpRouteSpec{
			Hosts: []string{body.Domain},
			Paths: []string{"/"},
			Schemes: []v1alpha1.HttpRouteScheme{
				"https", "http",
			},
			Methods: []v1alpha1.HttpRouteMethod{
				"GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "TRACE", "CONNECT",
			},
			HttpRedirectToHttps: true,
			Destinations: []v1alpha1.HttpRouteDestination{
				{
					Host:   "kalm.kalm-system.svc.cluster.local:80",
					Weight: 1,
				},
			},
		},
		Name: KalmRouteName,
	}

	ssoConfig := &resources.SSOConfig{
		SingleSignOnConfigSpec: &v1alpha1.SingleSignOnConfigSpec{
			Domain: body.Domain,
			// for local mode, no
			NeedExtraOAuthScope: false,
		},
	}

	temporaryAdmin := &TemporaryAdmin{
		Username: "admin",
		Password: utils.RandPassword(64),
		Email:    fmt.Sprintf("admin@%s", body.Domain),
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(temporaryAdmin.Password), 12)

	if err != nil {
		return err
	}

	if body.Issuer == "" {
		ssoConfig.SingleSignOnConfigSpec.TemporaryUser = &v1alpha1.TemporaryDexUser{
			Username:     temporaryAdmin.Username,
			PasswordHash: string(hashedPassword),
			UserID:       uuid.New().String(),
			Email:        temporaryAdmin.Email,
		}
	} else {
		ssoConfig.SingleSignOnConfigSpec.Issuer = body.Issuer
	}

	httpsCertForKalm := &resources.HttpsCert{
		Name:            KalmRouteCertName,
		HttpsCertIssuer: v1alpha1.DefaultHTTP01IssuerName,
		Domains:         []string{body.Domain},
	}

	protectedEndpoint := &resources.ProtectedEndpoint{
		Namespace:                   controllers.KalmSystemNamespace,
		EndpointName:                KalmProtectedEndpointName,
		Ports:                       []uint32{3001},
		AllowToPassIfHasBearerToken: true,
	}

	if !clusterInfo.IsProduction {
		ssoConfig.SingleSignOnConfigSpec.UseHttp = true
		ssoConfig.SingleSignOnConfigSpec.Port = clusterInfo.HttpPort

		route.HttpRouteSpec.HttpRedirectToHttps = false
		route.HttpRouteSpec.Schemes = []v1alpha1.HttpRouteScheme{"http"}
	} else {
		_, err := h.resourceManager.CreateAutoManagedHttpsCert(httpsCertForKalm)
		if err != nil {
			return err
		}
	}

	_, err = h.resourceManager.CreateHttpRoute(route)

	if err != nil {
		return err
	}

	_, err = h.resourceManager.CreateProtectedEndpoint(protectedEndpoint)

	if err != nil {
		return err
	}

	ssoConfig, err = h.resourceManager.CreateSSOConfig(ssoConfig)

	if err != nil {
		return err
	}

	if body.Issuer == "" {
		//bind clusterOwner for this tmpUser
		roleBinding := v1alpha1.RoleBinding{
			ObjectMeta: v1.ObjectMeta{
				Namespace: v1alpha1.KalmSystemNamespace,
			},
			Spec: v1alpha1.RoleBindingSpec{
				Subject:     temporaryAdmin.Email,
				SubjectType: v1alpha1.SubjectTypeUser,
				Role:        v1alpha1.ClusterRoleOwner,
				Creator:     getCurrentUser(c).Name,
			},
		}

		roleBinding.Name = roleBinding.GetNameBaseOnRoleAndSubject()

		if err := h.resourceManager.Create(&roleBinding); err != nil {
			return err
		}
	}

	return c.JSON(200, &SetupClusterResponse{
		ClusterInfo:   clusterInfo,
		SSO:           ssoConfig,
		Route:         route,
		Cert:          httpsCertForKalm,
		TemporaryUser: temporaryAdmin,
	})
}

func (h *ApiHandler) handleResetCluster(c echo.Context) error {

	h.MustCanManageCluster(getCurrentUser(c))

	wg := sync.WaitGroup{}

	wg.Add(1)
	go func() {
		defer wg.Done()
		_ = h.resourceManager.DeleteHttpRoute(controllers.KalmSystemNamespace, KalmRouteName)
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		_ = h.resourceManager.DeleteHttpsCert(KalmRouteCertName)
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		_ = h.resourceManager.DeleteSSOConfig()
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		_ = h.resourceManager.DeleteProtectedEndpoints(&resources.ProtectedEndpoint{
			Namespace:    controllers.KalmSystemNamespace,
			EndpointName: KalmProtectedEndpointName,
		})
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		err := h.resourceManager.DeleteAllRoleBindings()
		if err != nil {
			h.logger.Error("fail DeleteAllRoleBindings when reset()", zap.Error(err))
		}
	}()

	wg.Wait()
	return c.NoContent(200)
}
