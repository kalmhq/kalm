package server

import (
	"github.com/kapp-staging/kapp/api/config"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"net/http"
	"os"
)

func customHTTPErrorHandler(err error, c echo.Context) {
	code := http.StatusInternalServerError
	if he, ok := err.(*echo.HTTPError); ok {
		code = he.Code
	}

	c.Logger().Error(err)

	if !c.Response().Committed {
		c.JSON(code, map[string]interface{}{"desc": err.Error()})
	}
}

func newEchoInstance() *echo.Echo {
	e := echo.New()
	e.HideBanner = true
	e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		Format: "method=${method}, uri=${uri}, status=${status}\n",
	}))

	// TODO, only enabled cors on dev env

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodHead, http.MethodPut, http.MethodPatch, http.MethodPost, http.MethodDelete},
		MaxAge:       86400,
	}))

	e.HTTPErrorHandler = customHTTPErrorHandler

	return e
}

func NewEchoServer(runningConfig *config.Config) *echo.Echo {
	e := newEchoInstance()

	// in production docker build, all things are in a single docker
	// golang api server is charge of return frontend files to users
	// If the STATIC_FILE_ROOT is set, add extra routes to handle static files
	staticFileRoot := os.Getenv("STATIC_FILE_ROOT")
	if staticFileRoot != "" {
		e.Use(middleware.StaticWithConfig(middleware.StaticConfig{
			Root:  staticFileRoot,
			HTML5: true,
		}))
	}

	return e
}
