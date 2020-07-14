module github.com/kalmhq/kalm/api

go 1.13

require (
	github.com/coreos/go-oidc v2.2.1+incompatible
	github.com/dgrijalva/jwt-go v3.2.0+incompatible
	github.com/go-playground/validator/v10 v10.2.0
	github.com/gorilla/websocket v1.4.2
	github.com/joho/godotenv v1.3.0
	github.com/kalmhq/kalm/controller v0.1.0
	github.com/labstack/echo/v4 v4.1.15
	github.com/mattn/go-sqlite3 v2.0.3+incompatible
	github.com/prometheus/client_golang v1.7.1 // indirect
	github.com/sirupsen/logrus v1.4.2
	github.com/stretchr/testify v1.5.1
	github.com/urfave/cli/v2 v2.2.0
	golang.org/x/crypto v0.0.0-20200302210943-78000ba7a073 // indirect
	golang.org/x/net v0.0.0-20200301022130-244492dfa37a // indirect
	golang.org/x/oauth2 v0.0.0-20200107190931-bf48bf16ab8d
	k8s.io/api v0.17.3
	k8s.io/apimachinery v0.17.3
	k8s.io/client-go v0.17.3
	k8s.io/metrics v0.17.3
	k8s.io/utils v0.0.0-20200229041039-0a110f9eb7ab // indirect
	sigs.k8s.io/controller-runtime v0.4.0
)

replace github.com/kalmhq/kalm/controller => ../controller
