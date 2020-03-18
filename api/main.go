package main

import _ "github.com/joho/godotenv/autoload"

import (
	"github.com/kapp-staging/kapp/api/client"
	"github.com/kapp-staging/kapp/api/config"
	"github.com/kapp-staging/kapp/api/handler"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/urfave/cli/v2"
	"log"
	"net/http"
	"os"
	"sort"
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
	runningConfig := &config.Config{}

	app := &cli.App{
		Name:        "kapp-apiserver",
		Version:     "0.1.0",
		Usage:       "Kapp Api Server",
		Description: "KappApiServer is a key component in kapp system. It works between kapp dashboard and kubernetes api server to proxy requests and delegate authorizations.",
		Action: func(c *cli.Context) error {
			runningConfig.Install()
			run(runningConfig)
			return nil
		},
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:        "bind-address",
				Value:       "0.0.0.0",
				Destination: &runningConfig.BindAddress,
				Usage:       "The IP address on which to listen for the --port port. If blank, all interfaces will be used (0.0.0.0 for all IPv4 interfaces and :: for all IPv6 interfaces).",
				Aliases:     []string{"b"},
				EnvVars:     []string{"BIND_ADDRESS"},
			},
			&cli.IntFlag{
				Name:        "port",
				Usage:       "The port on which to serve.",
				Value:       3001,
				Destination: &runningConfig.Port,
				Aliases:     []string{"p"},
				EnvVars:     []string{"PORT"},
			},
			&cli.StringSliceFlag{
				Name:        "cors-allowed-origins",
				Usage:       "List of allowed origins for CORS, comma separated. An allowed origin can be a regular expression to support subdomain matching. If this list is empty CORS will not be enabled.",
				Destination: &runningConfig.CorsAllowedOrigins,
				EnvVars:     []string{"CORS_ALLOWED_ORIGINS"},
			},
			&cli.StringFlag{
				Name:        "k8s-api-server-address",
				Usage:       "Only required when running kapp api server out of kubernetes cluster. The kubernetes api server address",
				Destination: &runningConfig.KubernetesApiServerAddress,
				EnvVars:     []string{"K8S_API_SERVER_ADDRESS"},
			},
			&cli.StringFlag{
				Name: "k8s-api-server-ca-file-path",
				Usage: "Only required when --k8s-api-server-address is set, your kubernetes api server served through https and using a self signed certification. " +
					"The CA file of your kubernetes api server is using.",
				Destination: &runningConfig.KubernetesApiServerCAFilePath,
				EnvVars:     []string{"K8S_API_SERVER_CA_FILE_PATH"},
			},
			&cli.StringFlag{
				Name: "kube-config-path",
				Usage: "Only required when running kapp api server out of kubernetes cluster. " +
					"Kapp api server will read kubernetes config file and try to connect the current context kubernetes cluster. " +
					"It only recommend to use this way in DEVELOPMENT mode.",
				DefaultText: "$HOME/.kube/config",
				Destination: &runningConfig.KubeConfigPath,
				EnvVars:     []string{"KUBE_CONFIG_PATH"},
			},
			&cli.StringFlag{
				Name:        "log-level",
				Value:       "INFO",
				Usage:       "DEBUG, INFO, WARN, ERROR",
				Destination: &runningConfig.LogLevel,
				EnvVars:     []string{"LOG_LEVEL"},
			},
		},
		EnableBashCompletion: true,
	}

	sort.Sort(cli.FlagsByName(app.Flags))
	sort.Sort(cli.CommandsByName(app.Commands))

	err := app.Run(os.Args)

	if err != nil {
		log.Fatal(err)
	}
}

func run(runningConfig *config.Config) {
	e := newEchoInstance()
	clientManager := client.NewClientManager(runningConfig)
	apiHandler := handler.NewApiHandler(clientManager)
	apiHandler.Install(e)

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

	e.Logger.Fatal(e.Start(runningConfig.GetServerAddress()))
}
