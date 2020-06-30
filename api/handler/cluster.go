package handler

import (
	"github.com/labstack/echo/v4"
	coreV1 "k8s.io/api/core/v1"
	"regexp"
	"strconv"
	"strings"
)

type ClusterInfo struct {
	Version         string `json:"version"`
	IngressIP       string `json:"ingressIP"`
	IngressHostname string `json:"ingressHostname"`
	HttpPort        *int   `json:"httpPort"`
	HttpsPort       *int   `json:"httpsPort"`
	TLSPort         *int   `json:"tlsPort"`
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

func (h *ApiHandler) handleClusterInfo(c echo.Context) error {
	info := &ClusterInfo{}

	var ingressService coreV1.Service
	err := h.Builder(c).Get("istio-system", "istio-ingressgateway", &ingressService)

	if err == nil {
		if len(ingressService.Status.LoadBalancer.Ingress) > 0 {

			info.IngressIP = ingressService.Status.LoadBalancer.Ingress[0].IP
			info.IngressHostname = ingressService.Status.LoadBalancer.Ingress[0].Hostname

			httpPort := 80
			info.HttpPort = &httpPort

			httpsPort := 443
			info.HttpsPort = &httpsPort

			tlsPort := 15443
			info.TLSPort = &tlsPort
		}

		// For development and test env.
		// If the cluster is in a private network, we assume it's a development env.
		// Use the api server host as the cluster ingress ip

		if info.IngressIP == "" {
			r := regexp.MustCompile(`(\d+)\.(\d+)\.(\d+)\.(\d+)`)
			cfg := getK8sClientConfig(c)
			matches := r.FindStringSubmatch(cfg.Host)

			if len(matches) > 0 && isPrivateIP(matches[0]) {
				info.IngressIP = matches[0]

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
			}
		}
	}

	version, err := getK8sClient(c).ServerVersion()

	if err == nil {
		info.Version = version.GitVersion
	}

	return c.JSON(200, info)
}
