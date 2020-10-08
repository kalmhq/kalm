package server

import (
	"flag"
	"fmt"
	"net"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/kalmhq/kalm/api/errors"
	"github.com/kalmhq/kalm/api/log"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"go.uber.org/zap/zapcore"
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
	e.Use(middleware.Logger())
	e.Use(debugHeaderMiddleware)
	e.Pre(middleware.RemoveTrailingSlash())

	e.Use(CORSWithConfig(CORSConfig{
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

func debugHeaderMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		if log.DefaultLogger().Check(zapcore.DebugLevel, "") == nil {
			return next(c)
		}

		for k, v := range c.Request().Header {
			log.Debug(fmt.Sprintf("Header \"%s: %+v\"", k, v))
		}

		return next(c)
	}
}
