package handler

import (
	"fmt"
	"github.com/google/uuid"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/api/utils"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/kalmhq/kalm/controller/controllers"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"regexp"
	"strconv"
	"strings"
	"sync"
)

type ClusterInfo struct {
	Version          string `json:"version"`
	IngressIP        string `json:"ingressIP"`
	IngressHostname  string `json:"ingressHostname"`
	IsProduction     bool   `json:"isProduction"`
	HttpPort         *int   `json:"httpPort"`
	HttpsPort        *int   `json:"httpsPort"`
	TLSPort          *int   `json:"tlsPort"`
	CanBeInitialized bool   `json:"canBeInitialized"`
}

func isPrivateIP(ip string) bool {
	parts := strings.Split(ip, ".")
	if len(parts) != 4 {
		return false
	}

	if parts[0] == "10" || parts[0] == "192" && parts[1] == "168" {
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
	builder := h.Builder(c)

	info := &ClusterInfo{}

	httpPort := 80
	info.HttpPort = &httpPort

	httpsPort := 443
	info.HttpsPort = &httpsPort

	tlsPort := 15443
	info.TLSPort = &tlsPort

	var ingressService coreV1.Service
	err := builder.Get("istio-system", "istio-ingressgateway", &ingressService)

	if err == nil {
		for _, port := range ingressService.Spec.Ports {
			if port.Name == "http2" || port.Name == "http" {
				p := int(port.NodePort)
				info.HttpPort = &p
			}

			if port.Name == "https" {
				p := int(port.NodePort)
				info.HttpsPort = &p
			}

			if port.Name == "tls" {
				p := int(port.NodePort)
				info.TLSPort = &p
			}
		}

		if len(ingressService.Status.LoadBalancer.Ingress) > 0 {
			info.IngressIP = ingressService.Status.LoadBalancer.Ingress[0].IP
			info.IngressHostname = ingressService.Status.LoadBalancer.Ingress[0].Hostname
		}

		if info.IngressIP != "" && !isPrivateIP(info.IngressIP) {
			info.IsProduction = true
		}
	}

	if info.IngressIP == "" && info.IngressHostname == "" {
		r := regexp.MustCompile(`(\d+)\.(\d+)\.(\d+)\.(\d+)`)
		cfg := getK8sClientConfig(c)
		matches := r.FindStringSubmatch(cfg.Host)

		if len(matches) > 0 && isPrivateIP(matches[0]) {
			info.IngressIP = matches[0]
		}
	}

	var certNotFound, routeNotFound, ssoNotFound bool

	wg := sync.WaitGroup{}
	wg.Add(1)
	go func() {
		defer wg.Done()
		certNotFound = errors.IsNotFound(builder.Get(
			"",
			KalmRouteCertName,
			&v1alpha1.HttpsCert{},
		))
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		routeNotFound = errors.IsNotFound(builder.Get(
			controllers.KALM_DEX_NAMESPACE,
			KalmRouteName,
			&v1alpha1.HttpsCert{},
		))
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		ssoNotFound = errors.IsNotFound(builder.Get(
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

	version, err := getK8sClient(c).ServerVersion()

	if err == nil {
		info.Version = version.GitVersion
	}

	return info
}

func (h *ApiHandler) handleClusterInfo(c echo.Context) error {
	return c.JSON(200, h.getClusterInfo(c))
}

const (
	KalmRouteCertName         = "kalm-cert"
	KalmRouteName             = "kalm-route"
	KalmProtectedEndpointName = "kalm"
)

type SetupClusterBody struct {
	Domain string `json:"domain"`
}

type TemporaryAdmin struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type SetupClusterResponse struct {
	Cert          *resources.HttpsCert `json:"cert"`
	Route         *resources.HttpRoute `json:"route"`
	SSO           *resources.SSOConfig `json:"sso"`
	TemporaryUser *TemporaryAdmin      `json:"temporaryAdmin"`
	ClusterInfo   *ClusterInfo         `json:"clusterInfo"`
}

func (h *ApiHandler) handleInitializeCluster(c echo.Context) error {
	clusterInfo := h.getClusterInfo(c)

	if !clusterInfo.CanBeInitialized {
		return fmt.Errorf("The cluster is already initialized")
	}

	var body SetupClusterBody

	if err := c.Bind(&body); err != nil {
		return err
	}

	builder := h.Builder(c)

	route := &resources.HttpRoute{
		HttpRouteSpec: &v1alpha1.HttpRouteSpec{
			Hosts: []string{body.Domain},
			Paths: []string{"/"},
			Schemes: v1alpha1.HttpRouteSchemes{
				"https", "http",
			},
			Methods: []v1alpha1.HttpRouteMethod{
				"GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "TRACE", "CONNECT",
			},
			HttpRedirectToHttps: true,
			Destinations: []v1alpha1.HttpRouteDestination{
				{
					Host:   "kalm.kalm-system.svc.cluster.local:3001",
					Weight: 1,
				},
			},
		},
		Name:      KalmRouteName,
		Namespace: controllers.NamespaceKalmSystem,
	}

	temporaryAdmin := &TemporaryAdmin{
		Username: "admin",
		Password: utils.RandPassword(64),
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(temporaryAdmin.Password), bcrypt.DefaultCost)

	if err != nil {
		return err
	}

	ssoConfig := &resources.SSOConfig{
		SingleSignOnConfigSpec: &v1alpha1.SingleSignOnConfigSpec{
			Domain: body.Domain,
			TemporaryUser: &v1alpha1.TemporaryDexUser{
				Username:     temporaryAdmin.Username,
				PasswordHash: string(hashedPassword),
				UserID:       uuid.New().String(),
				Email:        "temporary-admin@temporary.admin",
			},
		},
	}

	httpsCertForKalm := &resources.HttpsCert{
		Name:            KalmRouteCertName,
		HttpsCertIssuer: controllers.DefaultHTTP01IssuerName,
		Domains:         []string{body.Domain},
	}

	protectedEndpoint := &resources.ProtectedEndpoint{
		Namespace:    controllers.NamespaceKalmSystem,
		EndpointName: "kalm",
	}

	if !clusterInfo.IsProduction {
		ssoConfig.SingleSignOnConfigSpec.UseHttp = true
		ssoConfig.SingleSignOnConfigSpec.Port = clusterInfo.HttpPort

		route.HttpRouteSpec.HttpRedirectToHttps = false
		route.HttpRouteSpec.Schemes = []string{"http"}
	} else {
		_, err := builder.CreateAutoManagedHttpsCert(httpsCertForKalm)
		if err != nil {
			return err
		}
	}

	_, err = builder.CreateHttpRoute(route)

	if err != nil {
		return err
	}

	_, err = h.Builder(c).CreateProtectedEndpoint(protectedEndpoint)

	if err != nil {
		return err
	}

	ssoConfig, err = h.Builder(c).CreateSSOConfig(ssoConfig)

	if err != nil {
		return err
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
	builder := h.Builder(c)
	_ = builder.DeleteHttpRoute(controllers.NamespaceKalmSystem, KalmRouteName)
	_ = builder.DeleteHttpsCert(KalmRouteCertName)
	_ = builder.DeleteSSOConfig()
	_ = builder.DeleteProtectedEndpoints(&resources.ProtectedEndpoint{
		Namespace:    controllers.NamespaceKalmSystem,
		EndpointName: "kalm",
	})
	return c.NoContent(200)
}
