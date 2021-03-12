module github.com/kalmhq/kalm/api

go 1.15

require (
	github.com/casbin/casbin/v2 v2.11.2
	github.com/coreos/go-oidc v2.2.1+incompatible
	github.com/dgrijalva/jwt-go v3.2.0+incompatible
	github.com/go-playground/validator/v10 v10.3.0
	github.com/google/uuid v1.1.2
	github.com/gorilla/websocket v1.4.2
	github.com/joho/godotenv v1.3.0
	github.com/kalmhq/kalm/controller v0.0.0-20200722131031-2336d7eaf4c9
	github.com/kalmhq/kalm/operator v0.0.0-20210302081042-e6a4c5b51613 // indirect
	github.com/labstack/echo/v4 v4.1.17
	github.com/labstack/gommon v0.3.0
	github.com/mattn/go-sqlite3 v2.0.3+incompatible
	github.com/pquerna/cachecontrol v0.0.0-20180517163645-1555304b9b35 // indirect
	github.com/stretchr/testify v1.6.1
	github.com/urfave/cli/v2 v2.3.0
	go.uber.org/zap v1.15.0
	golang.org/x/crypto v0.0.0-20200820211705-5c72a883971a
	golang.org/x/net v0.0.0-20201110031124-69a78807bb2b
	golang.org/x/oauth2 v0.0.0-20200107190931-bf48bf16ab8d
	gomodules.xyz/jsonpatch/v2 v2.1.0
	gopkg.in/square/go-jose.v2 v2.5.1 // indirect
	gotest.tools v2.2.0+incompatible
	k8s.io/api v0.18.6
	k8s.io/apimachinery v0.18.6
	k8s.io/client-go v0.18.6
	k8s.io/metrics v0.18.4
	sigs.k8s.io/controller-runtime v0.6.3
)

replace github.com/kalmhq/kalm/controller => ../controller
