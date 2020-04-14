module github.com/kapp-staging/kapp/api

go 1.12

require (
	github.com/aws/aws-sdk-go v1.25.48 // indirect
	github.com/containerd/continuity v0.0.0-20200228182428-0f16d7a0959c // indirect
	github.com/coreos/prometheus-operator v0.29.0
	github.com/davecgh/go-spew v1.1.1
	github.com/dgrijalva/jwt-go v3.2.0+incompatible
	github.com/docker/distribution v2.7.1+incompatible // indirect
	github.com/docker/go-connections v0.4.0 // indirect
	github.com/go-playground/validator/v10 v10.2.0
	github.com/google/pprof v0.0.0-20190723021845-34ac40c74b70 // indirect
	github.com/gorilla/websocket v1.4.2
	github.com/influxdata/influxdb v1.7.7
	github.com/joho/godotenv v1.3.0
	github.com/kapp-staging/kapp/controller v0.1.0
	github.com/kapp-staging/kapp/lib v0.0.0-00010101000000-000000000000
	github.com/labstack/echo/v4 v4.1.15
	github.com/mattn/go-shellwords v1.0.10 // indirect
	github.com/opencontainers/image-spec v1.0.1 // indirect
	github.com/opencontainers/runc v0.1.1 // indirect
	github.com/opencontainers/runtime-spec v1.0.2 // indirect
	github.com/sirupsen/logrus v1.4.2
	github.com/stretchr/testify v1.5.1
	github.com/urfave/cli/v2 v2.2.0
	github.com/vbatts/tar-split v0.11.1 // indirect
	golang.org/x/crypto v0.0.0-20200302210943-78000ba7a073 // indirect
	golang.org/x/net v0.0.0-20200301022130-244492dfa37a // indirect
	golang.org/x/oauth2 v0.0.0-20200107190931-bf48bf16ab8d // indirect
	gotest.tools v2.2.0+incompatible
	k8s.io/api v0.17.3
	k8s.io/apimachinery v0.17.3
	k8s.io/client-go v0.17.3
	k8s.io/metrics v0.17.3
	k8s.io/utils v0.0.0-20200229041039-0a110f9eb7ab // indirect
	sigs.k8s.io/controller-runtime v0.4.0
)

replace github.com/kapp-staging/kapp/controller => ../controller

replace github.com/kapp-staging/kapp/lib => ../lib
