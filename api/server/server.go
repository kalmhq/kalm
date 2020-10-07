package server

import (
	"flag"
	"net"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/kalmhq/kalm/api/errors"
	"github.com/kalmhq/kalm/api/log"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func isTest() bool {
	testFlag := flag.Lookup("test.v")

	if testFlag == nil {
		return false
	}

	return testFlag.Value.String() == "true"
}

// Only trust envoy external address or tcp remote address
func getClientIP(req *http.Request) string {
	host := req.Header.Get("X-Envoy-External-Address")

	if host == "" {
		host, _, _ = net.SplitHostPort(req.RemoteAddr)
	}

	return host
}

func NewEchoInstance() *echo.Echo {
	e := echo.New()
	e.HideBanner = true
	e.IPExtractor = getClientIP

	e.Use(middleware.Gzip())
	e.Use(middlewareLogging)
	e.Pre(middleware.RemoveTrailingSlash())

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{http.MethodGet, http.MethodHead, http.MethodPut, http.MethodPatch, http.MethodPost, http.MethodDelete},
		AllowCredentials: true,
		MaxAge:           86400,
	}))

	e.HTTPErrorHandler = errors.CustomHTTPErrorHandler

	return e
}

type CustomValidator struct {
	Validator *validator.Validate
}

func (cv *CustomValidator) Validate(i interface{}) error {
	return cv.Validator.Struct(i)
}

func middlewareLogging(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		if c != nil {
			log.Info("receive request", "method", c.Request().Method, "uri", c.Request().URL.String(), "ip", c.RealIP())
		} else {
			log.Info("receive request bad request")
		}

		return next(c)
	}
}
