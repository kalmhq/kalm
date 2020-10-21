module github.com/kalmhq/kalm/controller

go 1.15

require (
	github.com/coreos/prometheus-operator v0.29.0
	github.com/dlclark/regexp2 v1.2.0 // indirect
	github.com/docker/distribution v2.7.1+incompatible
	github.com/dop251/goja v0.0.0-20200721192441-a695b0cdd498
	github.com/elastic/cloud-on-k8s v0.0.0-20200721161711-b12a39f14ab1
	github.com/go-logr/logr v0.1.0
	github.com/go-openapi/validate v0.19.10
	github.com/go-sourcemap/sourcemap v2.1.3+incompatible // indirect
	github.com/gogo/protobuf v1.3.1
	github.com/heroku/docker-registry-client v0.0.0-20190909225348-afc9e1acc3d5
	github.com/jetstack/cert-manager v0.13.1
	github.com/joho/godotenv v1.3.0
	github.com/matttproud/golang_protobuf_extensions v1.0.2-0.20181231171920-c182affec369 // indirect
	github.com/onsi/ginkgo v1.12.1
	github.com/onsi/gomega v1.10.1
	github.com/opencontainers/image-spec v1.0.1 // indirect
	github.com/robfig/cron v1.2.0
	github.com/sirupsen/logrus v1.6.0 // indirect
	github.com/stretchr/testify v1.6.1
	github.com/xeipuuv/gojsonschema v1.2.0
	go.etcd.io/etcd v0.0.0-20191023171146-3cf2f69b5738
	golang.org/x/mod v0.3.0 // indirect
	golang.org/x/tools v0.0.0-20200616133436-c1934b75d054 // indirect
	gopkg.in/yaml.v3 v3.0.0-20200615113413-eeeca48fe776
	istio.io/api v0.0.0-20200721175012-ae75c7e9ae26
	istio.io/client-go v0.0.0-20200717004237-1af75184beba
	k8s.io/api v0.18.6
	k8s.io/apiextensions-apiserver v0.18.6
	k8s.io/apimachinery v0.18.6
	k8s.io/client-go v0.18.6
	k8s.io/kube-aggregator v0.17.2
	sigs.k8s.io/controller-runtime v0.6.3
)
