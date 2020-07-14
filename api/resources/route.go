package resources

import (
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type HttpRouteListChannel struct {
	List  chan []*v1alpha1.HttpRoute
	Error chan error
}

func (builder *Builder) GetHttpRouteListChannel(listOptions ...client.ListOption) *HttpRouteListChannel {
	channel := &HttpRouteListChannel{
		List:  make(chan []*v1alpha1.HttpRoute, 1),
		Error: make(chan error, 1),
	}

	go func() {

		var fetched v1alpha1.HttpRouteList
		err := builder.List(&fetched, listOptions...)

		if err != nil {
			channel.List <- nil
			channel.Error <- err
			return
		}

		res := make([]*v1alpha1.HttpRoute, len(fetched.Items))

		for i, route := range fetched.Items {
			res[i] = &route
		}

		channel.List <- res
		channel.Error <- err
	}()

	return channel
}

type HttpRoute struct {
	*v1alpha1.HttpRouteSpec `json:",inline"`
	Name                    string `json:"name"`
	Namespace               string `json:"namespace"`
}

func (builder *Builder) GetHttpRoute(namespace, name string) (*HttpRoute, error) {
	var route v1alpha1.HttpRoute

	if err := builder.Get(namespace, name, &route); err != nil {
		return nil, err
	}

	return BuildHttpRouteFromResource(&route), nil
}

func (builder *Builder) GetHttpRoutes(namespace string) ([]*HttpRoute, error) {
	var routes v1alpha1.HttpRouteList

	if err := builder.List(&routes, client.InNamespace(namespace)); err != nil {
		return nil, err
	}

	res := make([]*HttpRoute, len(routes.Items))

	for i := range routes.Items {
		res[i] = BuildHttpRouteFromResource(&routes.Items[i])
	}

	return res, nil
}

func BuildHttpRouteFromResource(route *v1alpha1.HttpRoute) *HttpRoute {
	return &HttpRoute{
		HttpRouteSpec: &route.Spec,
		Name:          route.Name,
		Namespace:     route.Namespace,
	}
}

func (builder *Builder) CreateHttpRoute(routeSpec *HttpRoute) (*HttpRoute, error) {
	route := &v1alpha1.HttpRoute{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      routeSpec.Name,
			Namespace: routeSpec.Namespace,
		},
		Spec: *routeSpec.HttpRouteSpec,
	}

	if err := builder.Create(route); err != nil {
		return nil, err
	}

	return BuildHttpRouteFromResource(route), nil
}

func (builder *Builder) UpdateHttpRoute(routeSpec *HttpRoute) (*HttpRoute, error) {
	route := &v1alpha1.HttpRoute{}

	if err := builder.Get(routeSpec.Namespace, routeSpec.Name, route); err != nil {
		return nil, err
	}

	route.Spec = *routeSpec.HttpRouteSpec

	if err := builder.Update(route); err != nil {
		return nil, err
	}

	return BuildHttpRouteFromResource(route), nil
}

func (builder *Builder) DeleteHttpRoute(namespace, name string) error {
	return builder.Delete(&v1alpha1.HttpRoute{ObjectMeta: metaV1.ObjectMeta{Name: name, Namespace: namespace}})
}
