package main

import (
	"net/http"
	"os"
	"sort"

	_ "k8s.io/client-go/plugin/pkg/client/auth"

	"github.com/kalmhq/kuench/api/config"
	"github.com/kalmhq/kuench/api/handlers"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	log "github.com/sirupsen/logrus"
	"github.com/urfave/cli/v2"
	"k8s.io/client-go/rest"
)

func main() {
	runningConfig := &config.Config{}

	app := &cli.App{
		Name:        "Kuench-apiserver",
		Version:     "0.1.0",
		Usage:       "Kuench Api Server",
		Description: "Kuench Api Server is a key component in Kuench system. It works between Kuench dashboard and Kubernetes api server to proxy requests.",
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
			&cli.BoolFlag{
				Name:        "verbose",
				Value:       false,
				Usage:       "show debug log",
				Destination: &runningConfig.Verbose,
				EnvVars:     []string{"VERBOSE"},
			},
		},
		Action: func(c *cli.Context) error {
			runningConfig.Install()
			run(runningConfig)
			return nil
		},
		EnableBashCompletion: true,
	}

	sort.Sort(cli.FlagsByName(app.Flags))
	sort.Sort(cli.CommandsByName(app.Commands))

	err := app.Run(os.Args)

	if err != nil {
		panic(err)
	}
}

func run(runningConfig *config.Config) {
	k8sClientConfig, err := initClusterK8sClientConfiguration(runningConfig)

	if err != nil {
		panic(err)
	}

	go func() {
		if runningConfig.IsInCluster() {
			// startMetricServer(k8sClientConfig)
		} else {
			log.Info("not running in cluster, skip running metric server")
		}
	}()

	// run localhost server with privilege
	// clonedConfig := runningConfig.DeepCopy()
	// clonedConfig.PrivilegedLocalhostAccess = true
	// clonedConfig.BindAddress = "127.0.0.1"
	// clonedConfig.Port = 3010
	// go startMainServer(clonedConfig, k8sClientConfig)

	// real server serve
	// runningConfig.PrivilegedLocalhostAccess = false
	startMainServer(runningConfig, k8sClientConfig)
}

func NewEchoInstance() *echo.Echo {
	e := echo.New()
	e.HideBanner = true

	e.Use(middleware.Gzip())
	e.Use(middleware.Logger())
	// e.Pre(debugHeaderMiddleware)
	e.Pre(middleware.RemoveTrailingSlash())

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{http.MethodGet, http.MethodHead, http.MethodPut, http.MethodPatch, http.MethodPost, http.MethodDelete},
		AllowCredentials: true,
		MaxAge:           86400,
	}))

	// e.HTTPErrorHandler = errors.CustomHTTPErrorHandler

	return e
}

func startMainServer(runningConfig *config.Config, k8sClientConfig *rest.Config) {
	e := NewEchoInstance()

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

	handler := handlers.NewApiHandler(k8sClientConfig)
	handler.InstallMainRoutes(e)

	// e.Validator = &server.CustomValidator{Validator: validator.New()}
	// var clientManager client.ClientManager

	// if runningConfig.PrivilegedLocalhostAccess {
	// clientManager = client.NewLocalClientManager(k8sClientConfig)
	// } else {
	// clientManager = client.NewStandardClientManager(k8sClientConfig, "")
	// }

	// apiHandler := handler.NewApiHandler(clientManager)

	// apiHandler.InstallMainRoutes(e)
	// apiHandler.InstallWebhookRoutes(e)

	// if runningConfig.PrivilegedLocalhostAccess {
	// 	apiHandler.InstallAdminRoutes(e)
	// }

	// if runningConfig.EnableAdminServerDebugRoutes {
	// 	apiHandler.InstallAdminDebugRoutes(e)
	// }

	err := e.Start(runningConfig.GetServerAddress())

	if err != nil {
		panic(err)
	}
}
