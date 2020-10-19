module github.com/kalmhq/kalm/operator

go 1.15

require (
	github.com/go-logr/logr v0.1.0
	github.com/jetstack/cert-manager v0.13.1
	github.com/kalmhq/kalm/controller v0.0.0-20200709120351-d96177bbf37a
	github.com/prometheus/prometheus v1.8.2
	gopkg.in/yaml.v3 v3.0.0-20200615113413-eeeca48fe776
	istio.io/api v0.0.0-20200721175012-ae75c7e9ae26
	istio.io/client-go v0.0.0-20200717004237-1af75184beba
	k8s.io/api v0.18.6
	k8s.io/apiextensions-apiserver v0.18.6
	k8s.io/apimachinery v0.18.6
	k8s.io/client-go v0.18.6
	sigs.k8s.io/controller-runtime v0.6.3
)

replace github.com/kalmhq/kalm/controller => ../controller
