module github.com/kapp-staging/kapp

go 1.12

require (
	cloud.google.com/go v0.49.0 // indirect
	github.com/cespare/xxhash/v2 v2.1.1 // indirect
	github.com/coreos/prometheus-operator v0.29.0
	github.com/elastic/cloud-on-k8s v0.0.0-20200204083752-bcb7468838a8
	github.com/go-logr/logr v0.1.0
	github.com/golang/groupcache v0.0.0-20191027212112-611e8accdfc9 // indirect
	github.com/influxdata/influxdb v1.7.7
	github.com/jetstack/cert-manager v0.13.1
	github.com/kapp-staging/kapp/lib v0.0.0-00010101000000-000000000000
	github.com/onsi/ginkgo v1.10.3
	github.com/onsi/gomega v1.7.1
	github.com/prometheus/client_golang v1.2.1 // indirect
	github.com/prometheus/procfs v0.0.6 // indirect
	github.com/stretchr/testify v1.5.1
	golang.org/x/net v0.0.0-20191112182307-2180aed22343 // indirect
	golang.org/x/sys v0.0.0-20191113165036-4c7a9d0fe056 // indirect
	golang.org/x/time v0.0.0-20191024005414-555d28b269f0 // indirect
	gopkg.in/yaml.v2 v2.2.8
	k8s.io/api v0.17.3
	k8s.io/apiextensions-apiserver v0.17.3
	k8s.io/apimachinery v0.17.3
	k8s.io/client-go v0.17.3
	k8s.io/kube-aggregator v0.17.0
	k8s.io/utils v0.0.0-20191114200735-6ca3b61696b6 // indirect
	sigs.k8s.io/controller-runtime v0.4.0
)

replace github.com/kapp-staging/kapp/lib => ../lib
