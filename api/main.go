package main

import (
	"context"
	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/net/http2"
	"time"

	_ "github.com/joho/godotenv/autoload"
	"github.com/kalmhq/kalm/api/client"
	"github.com/kalmhq/kalm/api/config"
	"github.com/kalmhq/kalm/api/handler"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/api/server"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/urfave/cli/v2"
	"k8s.io/client-go/kubernetes/scheme"
	"os"
	"sort"
)

func main() {
	runningConfig := &config.Config{}

	app := &cli.App{
		Name:        "kalm-apiserver",
		Version:     "0.1.0",
		Usage:       "Kalm Api Server",
		Description: "KalmApiServer is a key component in kalm system. It works between kalm dashboard and kubernetes api server to proxy requests and delegate authorizations.",
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
			&cli.IntFlag{
				Name:        "webhook server port",
				Usage:       "The port on which to webhook server serve.",
				Value:       3002,
				Destination: &runningConfig.WebhookPort,
				Aliases:     []string{"wp"},
				EnvVars:     []string{"WEBHOOK_PORT"},
			},
			&cli.StringSliceFlag{
				Name:        "cors-allowed-origins",
				Usage:       "List of allowed origins for CORS, comma separated. An allowed origin can be a regular expression to support subdomain matching. If this list is empty CORS will not be enabled.",
				Destination: &runningConfig.CorsAllowedOrigins,
				EnvVars:     []string{"CORS_ALLOWED_ORIGINS"},
			},
			&cli.StringFlag{
				Name:        "k8s-api-server-address",
				Usage:       "Only required when running kalm api server out of kubernetes cluster. The kubernetes api server address",
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
				Usage: "Only required when running kalm api server out of kubernetes cluster. " +
					"Kalm api server will read kubernetes config file and try to connect the current context kubernetes cluster. " +
					"It only recommend to use this way in DEVELOPMENT mode.",
				DefaultText: "$HOME/.kube/config",
				Destination: &runningConfig.KubeConfigPath,
				EnvVars:     []string{"KUBE_CONFIG_PATH"},
			},
			&cli.StringFlag{
				Name:        "log-level",
				Value:       "INFO",
				Usage:       "DEBUG, INFO, ERROR",
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
		panic(err)
	}
}

func startMainServer(runningConfig *config.Config) {
	e := server.NewEchoInstance()

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

	e.Validator = &server.CustomValidator{Validator: validator.New()}

	clientManager := client.NewClientManager(runningConfig)
	apiHandler := handler.NewApiHandler(clientManager)
	apiHandler.InstallMainRoutes(e)

	err := e.StartH2CServer(runningConfig.GetServerAddress(), &http2.Server{
		MaxConcurrentStreams: 250,
		MaxReadFrameSize:     1048576,
		IdleTimeout:          60 * time.Second,
	})

	if err != nil {
		panic(err)
	}
}

func startWebhookServer(runningConfig *config.Config) {
	e := server.NewEchoInstance()

	clientManager := client.NewClientManager(runningConfig)
	apiHandler := handler.NewApiHandler(clientManager)
	apiHandler.InstallWebhookRoutes(e)

	err := e.StartH2CServer(runningConfig.GetWebhookServerAddress(), &http2.Server{
		MaxConcurrentStreams: 250,
		MaxReadFrameSize:     1048576,
		IdleTimeout:          60 * time.Second,
	})

	if err != nil {
		panic(err)
	}
}

func startMetricServer(runningConfig *config.Config) {
	clientManager := client.NewClientManager(runningConfig)
	resources.StartMetricScraper(context.Background(), clientManager.ClusterConfig)
}

func run(runningConfig *config.Config) {
	if err := v1alpha1.AddToScheme(scheme.Scheme); err != nil {
		panic(err)
	}

	go startWebhookServer(runningConfig)
	go startMetricServer(runningConfig)

	// run localhost server with privilege
	clonedConfig := runningConfig.DeepCopy()
	clonedConfig.PrivilegedLocalhostAccess = true
	clonedConfig.BindAddress = "127.0.0.1"
	clonedConfig.Port = 3010
	go startMainServer(clonedConfig)

	// real server serve
	runningConfig.PrivilegedLocalhostAccess = false
	startMainServer(runningConfig)
}
