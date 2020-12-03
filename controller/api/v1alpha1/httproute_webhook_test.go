package v1alpha1

import (
	"testing"

	"github.com/stretchr/testify/assert"
	ctrl "sigs.k8s.io/controller-runtime"
)

func TestHttpRoute_Validate(t *testing.T) {
	route := HttpRoute{
		ObjectMeta: ctrl.ObjectMeta{
			Name: "test-name",
		},
		Spec: HttpRouteSpec{
			Hosts:   []string{"*.xip.io", "xip.io"},
			Methods: []HttpRouteMethod{"GET", "POST", "PUT"},
			Schemes: []HttpRouteScheme{"http", "https"},
			Paths:   []string{"/"},
			Destinations: []HttpRouteDestination{
				{Host: "server-v2:8080", Weight: 1},
				{Host: "server-v1", Weight: 1},
			},
			Mirror: &HttpRouteMirror{
				Percentage: 1,
				Destination: HttpRouteDestination{
					Host:   "server-v2:8080",
					Weight: 1,
				},
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
	}

	for _, h := range validRouteHosts {
		assert.True(t, isValidRouteHost(h))
	}
}

func TestHttpRoute_isValidDestinationHost(t *testing.T) {
	validRouteHosts := []string{
		"abc.xyz",
		"abc-def.xyz",
		"abc.xyz:9000",
		"abc-def.xyz:9000",
	}

	for _, h := range validRouteHosts {
		assert.True(t, isValidDestinationHost(h))
	}
}
