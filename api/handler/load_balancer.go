package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/controllers"
	"github.com/labstack/echo/v4"
	coreV1 "k8s.io/api/core/v1"
)

type LoadBalancer struct {
	Type  string     `json:"type"`
	IP    string     `json:"ip"`
	Ports []PortInfo `json:"ports"`
}

type PortInfo struct {
	Type string `json:"type"`
	Port int    `json:"port"`
}

func (h *ApiHandler) handleLoadBalancers(c echo.Context) error {
	if !h.clientManager.CanViewCluster(getCurrentUser(c)) {
		return resources.NoClusterViewerRoleError
	}

	return c.JSON(200, h.getLoadBalancers(c))
}

func (h *ApiHandler) getLoadBalancers(c echo.Context) (rst []LoadBalancer) {

	var svcList coreV1.ServiceList
	if err := h.resourceManager.List(&svcList); err != nil {
		h.logger.Error(err, "fail when list svcList")
		return nil
	}

	for _, svc := range svcList.Items {
		var ip string
		if len(svc.Status.LoadBalancer.Ingress) > 0 {
			ip = svc.Status.LoadBalancer.Ingress[0].IP
		}

		if svc.Namespace == "istio-system" &&
			svc.Name == "istio-ingressgateway" {

			rst = append(rst, LoadBalancer{
				Type: "IngressGateway",
				IP:   ip,
				Ports: []PortInfo{
					{
						Type: "HTTP",
						Port: 80,
					},
					{
						Type: "HTTPS",
						Port: 443,
					},
					{
						Type: "TLS",
						Port: 15443,
					},
				},
			})

		}

		if svc.Namespace == resources.KALM_SYSTEM_NAMESPACE &&
			svc.Name == controllers.GetNameForLoadBalanceServiceForNSDomain() {

			rst = append(rst, LoadBalancer{
				Type: "ACME-Server",
				IP:   ip,
				Ports: []PortInfo{
					{
						Type: "DNS",
						Port: 53,
					},
				},
			})
		}
	}

	return rst
}
