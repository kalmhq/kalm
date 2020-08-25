module github.com/kalmhq/kalm/api

go 1.13

require (
	github.com/coreos/go-oidc v2.2.1+incompatible
	github.com/davecgh/go-spew v1.1.1
	github.com/dgrijalva/jwt-go v3.2.0+incompatible
	github.com/evanphx/json-patch v4.5.0+incompatible
	github.com/go-logr/logr v0.1.0
	github.com/go-openapi/runtime v0.19.20 // indirect
	github.com/go-openapi/spec v0.19.9 // indirect
	github.com/go-playground/validator/v10 v10.3.0
	github.com/golang/groupcache v0.0.0-20200121045136-8c9f03a8e57e // indirect
	github.com/google/go-cmp v0.5.1 // indirect
	github.com/google/uuid v1.1.1
	github.com/gorilla/websocket v1.4.2
	github.com/imdario/mergo v0.3.10 // indirect
	github.com/jetstack/cert-manager v0.15.2 // indirect
	github.com/joho/godotenv v1.3.0
	github.com/kalmhq/kalm/controller v0.0.0-20200722131031-2336d7eaf4c9
	github.com/labstack/echo/v4 v4.1.16
	github.com/mattn/go-colorable v0.1.7 // indirect
	github.com/mattn/go-sqlite3 v2.0.3+incompatible
	github.com/opencontainers/image-spec v1.0.1 // indirect
	github.com/pquerna/cachecontrol v0.0.0-20180517163645-1555304b9b35 // indirect
	github.com/stretchr/testify v1.6.1
	github.com/urfave/cli/v2 v2.2.0
	github.com/valyala/fasttemplate v1.2.0 // indirect
	github.com/xeipuuv/gojsonpointer v0.0.0-20190905194746-02993c407bfb // indirect
	go.mongodb.org/mongo-driver v1.3.5 // indirect
	go.uber.org/zap v1.15.0
	golang.org/x/crypto v0.0.0-20200709230013-948cd5f35899
	golang.org/x/net v0.0.0-20200707034311-ab3426394381
	golang.org/x/oauth2 v0.0.0-20200107190931-bf48bf16ab8d
	golang.org/x/sys v0.0.0-20200720211630-cb9d2d5c5666 // indirect
	golang.org/x/time v0.0.0-20200630173020-3af7569d3a1e // indirect
	gomodules.xyz/jsonpatch/v2 v2.1.0
	google.golang.org/appengine v1.6.6 // indirect
	google.golang.org/protobuf v1.25.0 // indirect
	gopkg.in/square/go-jose.v2 v2.5.1
	gotest.tools v2.2.0+incompatible
	istio.io/api v0.0.0-20200722065756-9d7f2a3afc5b // indirect
	istio.io/gogo-genproto v0.0.0-20200720193312-b523a30fe746 // indirect
	k8s.io/api v0.18.6
	k8s.io/apimachinery v0.18.6
	k8s.io/client-go v0.18.4
	k8s.io/klog/v2 v2.1.0
	k8s.io/metrics v0.18.4
	k8s.io/utils v0.0.0-20200720150651-0bdb4ca86cbc // indirect
	sigs.k8s.io/controller-runtime v0.6.1
)

replace github.com/kalmhq/kalm/controller => ../controller
