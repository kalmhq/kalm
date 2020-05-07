module github.com/kapp-staging/kapp/operator

go 1.13

require (
	github.com/go-bindata/go-bindata v3.1.2+incompatible // indirect
	github.com/go-logr/logr v0.1.0
	github.com/jetstack/cert-manager v0.13.1
	github.com/urfave/cli/v2 v2.2.0
	gopkg.in/yaml.v3 v3.0.0-20190905181640-827449938966
	istio.io/api v0.0.0-20200324230725-4b064f75ad8f
	istio.io/client-go v0.0.0-20200324231647-289a91f51a8e
	k8s.io/apiextensions-apiserver v0.17.3
	k8s.io/apimachinery v0.17.3
	k8s.io/client-go v0.17.3
	sigs.k8s.io/controller-runtime v0.4.0
)
