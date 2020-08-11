package v1alpha1

import (
	"github.com/stretchr/testify/assert"
	ctrl "sigs.k8s.io/controller-runtime"
	"testing"
)

func TestHttpRoute_Validate(t *testing.T) {

	route := HttpRoute{
		ObjectMeta: ctrl.ObjectMeta{
			Namespace: "test-ns",
			Name:      "test-name",
		},
		Spec: HttpRouteSpec{
			Hosts:   []string{"*.xip.io", "xip.io"},
			Methods: []HttpRouteMethod{"GET", "POST", "PUT"},
			Schemes: []HttpRouteScheme{"http", "https"},
			Paths:   []string{"/"},
			Destinations: []HttpRouteDestination{
				{Host: "server-v2", Weight: 1},
				{Host: "server-v1", Weight: 1},
			},
			StripPath: true,
		},
	}

	route.Default()
	assert.Nil(t, route.validate())
}

func TestHttpRoute_isValidRouteHost(t *testing.T) {
	validRouteHosts := []string{
		"*.xip.io",
		"1.2.3.4.xip.io",
		"google.com",
		"1.2.3.4",
		"internal-k8s-host",
		"abc.def:3000",
		"google.com:8080",
	}

	for _, h := range validRouteHosts {
		assert.True(t, isValidRouteHost(h))
	}
}
