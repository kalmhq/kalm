package main

import (
	"context"
	"log"
	"os"
	"sort"

	_ "github.com/joho/godotenv/autoload"
	"github.com/kalm-staging/kalm/api/client"
	"github.com/kalm-staging/kalm/api/config"
	"github.com/kalm-staging/kalm/api/handler"
	"github.com/kalm-staging/kalm/api/resources"
	"github.com/kalm-staging/kalm/api/server"
	"github.com/kalm-staging/kalm/api/ws"
	"github.com/kalm-staging/kalm/controller/api/v1alpha1"
	"github.com/urfave/cli/v2"
	"k8s.io/client-go/kubernetes/scheme"
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
		log.Fatal("[Fatal] app.Run Failed:", err)
	}
}

func run(runningConfig *config.Config) {
	v1alpha1.AddToScheme(scheme.Scheme)

	e := server.NewEchoServer(runningConfig)

	clientManager := client.NewClientManager(runningConfig)

	wsHandler := ws.NewWsHandler(clientManager)
	e.GET("/ws", wsHandler.Serve)

	apiHandler := handler.NewApiHandler(clientManager)
	apiHandler.Install(e)

	// watcher.StartWatching(clientManager)

	go resources.StartMetricScraper(context.Background(), clientManager)
	e.Logger.Fatal(e.Start(runningConfig.GetServerAddress()))
}
