package handlers

import (
	"net/url"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	log "github.com/sirupsen/logrus"
	"k8s.io/client-go/rest"
)

type ApiHandler struct {
	// resourceManager *resources.ResourceManager
	// clientManager   client.ClientManager
	logger *log.Logger
	cfg    *rest.Config
}

func (h *ApiHandler) InstallMainRoutes(e *echo.Echo) {
	e.GET("/", handlePing)

	// proxy request to k8s with kubeconfig
	// It is designed as a handler instead of a global middleware to support multi-user and multi-cluster in the future.
	e.Any("/proxy*", func(c echo.Context) error {
		roundTripper, err := rest.TransportFor(h.cfg)

		if err != nil {
			return err
		}

		u, err := url.Parse(h.cfg.Host)
		if err != nil {
			return err
		}

		mid := middleware.ProxyWithConfig(middleware.ProxyConfig{
			Rewrite: map[string]string{
				"/proxy*": "$1",
			},
			Balancer:  middleware.NewRoundRobinBalancer([]*middleware.ProxyTarget{{URL: u}}),
			Transport: roundTripper,
		})

		return mid(nil)(c)
	})
}

func handlePing(c echo.Context) error {
	return c.String(200, "ok")
}

func NewApiHandler(cfg *rest.Config) *ApiHandler {
	return &ApiHandler{
		logger: log.New(),
		cfg:    cfg,
	}
}
