package main

import (
	"github.com/kapp-staging/kapp/api/client"
	"github.com/kapp-staging/kapp/api/handler"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"net/http"
	"os"
	"path/filepath"
	//"k8s.io/client-go/tools/clientcmd/api"
	//"k8s.io/client-go/plugin/pkg/client/auth"
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
	e.Use(middleware.CORS())
	e.HTTPErrorHandler = customHTTPErrorHandler

	return e
}

func main() {
	e := newEchoInstance()

	clientManager := client.NewClientManager("https://192.168.64.3:8443", filepath.Join(os.Getenv("HOME"), ".kube", "config"))
	apiHandler := handler.NewApiHandler(clientManager)
	apiHandler.Install(e)

	e.GET("/ping", func(c echo.Context) error {
		return c.String(200, "ok")
	})

	e.Logger.Fatal(e.Start(":3001"))
}
