/*

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package controllers

import (
	"context"
	"fmt"
	pbTypes "github.com/gogo/protobuf/types"
	"github.com/influxdata/influxdb/pkg/slices"
	istioNetworkingV1Beta1 "istio.io/api/networking/v1beta1"
	"istio.io/client-go/pkg/apis/networking/v1beta1"
	"k8s.io/apimachinery/pkg/types"
	"math"
	"net/http"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
	"sigs.k8s.io/controller-runtime/pkg/source"
	"sort"
	"strconv"
	"strings"

	corev1alpha1 "github.com/kapp-staging/kapp/controller/api/v1alpha1"
	ctrl "sigs.k8s.io/controller-runtime"
)

const (
	DEFAULT_HTTPS_CERT_NAME = "default-https-cert"
	KAPP_ROUTE_LABEL        = "kapp-route"
)

type HttpRouteReconcilerTask struct {
	*HttpRouteReconciler
	ctx             context.Context
	routes          []corev1alpha1.HttpRoute
	gateways        []v1beta1.Gateway
	virtualServices []v1beta1.VirtualService
}

// will not care about match
func (r *HttpRouteReconcilerTask) buildIstioHttpRoute(route *corev1alpha1.HttpRoute) *istioNetworkingV1Beta1.HTTPRoute {
	spec := &route.Spec
	httpRoute := &istioNetworkingV1Beta1.HTTPRoute{
		Route: r.BuildDestinations(route),
	}

	if spec.StripPath {
		httpRoute.Rewrite = &istioNetworkingV1Beta1.HTTPRewrite{
			Uri: "/",
		}
	}

	if spec.Timeout != nil {
		httpRoute.Timeout = &pbTypes.Duration{
			Seconds: int64(*spec.Timeout),
		}
	}

	if spec.Retries != nil {
		httpRoute.Retries = &istioNetworkingV1Beta1.HTTPRetry{
			Attempts: int32(spec.Retries.Attempts),
			PerTryTimeout: &pbTypes.Duration{
				Seconds: int64(spec.Retries.PerTtyTimeoutSeconds),
			},
			RetryOn: strings.Join(spec.Retries.RetryOn, ","),
		}
	}

	if spec.Mirror != nil {
		dest := toHttpRouteDestination(spec.Mirror.Destination, 100, route.Namespace)
		httpRoute.Mirror = dest.Destination
		httpRoute.MirrorPercentage = &istioNetworkingV1Beta1.Percent{
			Value: float64(spec.Mirror.Percentage),
		}
	}

	if spec.Fault != nil {
		if httpRoute.Fault == nil {
			httpRoute.Fault = &istioNetworkingV1Beta1.HTTPFaultInjection{}
		}

		httpRoute.Fault.Abort = &istioNetworkingV1Beta1.HTTPFaultInjection_Abort{
			ErrorType: &istioNetworkingV1Beta1.HTTPFaultInjection_Abort_HttpStatus{
				HttpStatus: int32(spec.Fault.ErrorStatus),
			},
			Percentage: &istioNetworkingV1Beta1.Percent{
				Value: float64(spec.Fault.Percentage),
			},
		}
	}

	if spec.Delay != nil {
		if httpRoute.Fault == nil {
			httpRoute.Fault = &istioNetworkingV1Beta1.HTTPFaultInjection{}
		}

		httpRoute.Fault.Delay = &istioNetworkingV1Beta1.HTTPFaultInjection_Delay{
			Percentage: &istioNetworkingV1Beta1.Percent{
				Value: float64(spec.Delay.Percentage),
			},
			HttpDelayType: &istioNetworkingV1Beta1.HTTPFaultInjection_Delay_FixedDelay{
				FixedDelay: &pbTypes.Duration{
					Seconds: int64(spec.Delay.DelaySeconds),
				},
			},
		}
	}

	if spec.CORS != nil {
		httpRoute.CorsPolicy = &istioNetworkingV1Beta1.CorsPolicy{
			AllowOrigins: make([]*istioNetworkingV1Beta1.StringMatch, 0, len(spec.CORS.AllowOrigins)),
			AllowMethods: spec.CORS.AllowMethods,
			AllowHeaders: spec.CORS.AllowHeaders,
			MaxAge: &pbTypes.Duration{
				Seconds: int64(spec.CORS.MaxAgeSeconds),
			},
		}

		for _, condition := range spec.CORS.AllowOrigins {
			httpRoute.CorsPolicy.AllowOrigins = append(httpRoute.CorsPolicy.AllowOrigins, conditionToStringMatch(condition))
		}
	}
	return httpRoute
}

func (r *HttpRouteReconcilerTask) buildIstioHttpRoutes(route *corev1alpha1.HttpRoute) []*istioNetworkingV1Beta1.HTTPRoute {
	matches := r.BuildMatches(route)
	res := make([]*istioNetworkingV1Beta1.HTTPRoute, 0)

	for _, match := range matches {
		httpRoute := r.buildIstioHttpRoute(route)
		httpRoute.Match = []*istioNetworkingV1Beta1.HTTPMatchRequest{match}
		res = append(res, httpRoute)
	}

	return res
}

// return should "a" sort before "b"
func sortRoutes(a, b *istioNetworkingV1Beta1.HTTPRoute) bool {
	aUri := a.Match[0].Uri
	bUri := b.Match[0].Uri

	aUriIsNil := aUri == nil
	bUriIsNil := bUri == nil

	if aUriIsNil {
		return false
	}

	if bUriIsNil {
		return true
	}

	aRegexp, aUriIsRegexp := aUri.MatchType.(*istioNetworkingV1Beta1.StringMatch_Regex)
	bRegexp, bUriIsRegexp := bUri.MatchType.(*istioNetworkingV1Beta1.StringMatch_Regex)

	if aUriIsRegexp && !bUriIsRegexp {
		return true
	}

	if !aUriIsRegexp && bUriIsRegexp {
		return false
	}

	if aUriIsRegexp && bUriIsRegexp {
		// TODO this is temporary solution
		// will use regexp priority later
		return aRegexp.Regex > bRegexp.Regex
	}

	aPrefix, aUriIsPrefix := aUri.MatchType.(*istioNetworkingV1Beta1.StringMatch_Prefix)
	bPrefix, bUriIsPrefix := bUri.MatchType.(*istioNetworkingV1Beta1.StringMatch_Prefix)

	if !aUriIsPrefix || !bUriIsPrefix {
		panic("uri is neither a regexp or a prefix")
	}

	// Long prefix should be nearer to the front
	return aPrefix.Prefix > bPrefix.Prefix
}

func (r *HttpRouteReconcilerTask) Run(ctrl.Request) error {
	var routes corev1alpha1.HttpRouteList
	if err := r.Reader.List(r.ctx, &routes); err != nil {
		return err
	}
	r.routes = routes.Items

	var virtualServices v1beta1.VirtualServiceList
	if err := r.Reader.List(r.ctx, &virtualServices, client.MatchingLabels{KAPP_ROUTE_LABEL: "true"}); err != nil {
		return err
	}
	r.virtualServices = virtualServices.Items

	// Each host will has a virtual service
	// Kapp will order http route rules, and set them in the virtual service http field.
	hostVirtualService := make(map[string][]*istioNetworkingV1Beta1.HTTPRoute)

	for _, route := range r.routes {
		for _, host := range route.Spec.Hosts {
			if _, ok := hostVirtualService[host]; ok {
				hostVirtualService[host] = append(hostVirtualService[host], r.buildIstioHttpRoutes(&route)...)
			} else {
				hostVirtualService[host] = r.buildIstioHttpRoutes(&route)
			}
		}
	}

	for host, routes := range hostVirtualService {
		// Less reports whether the element with
		// index i should sort before the element with index j.
		sort.Slice(routes, func(i, j int) bool { return sortRoutes(routes[i], routes[j]) })

		if err := r.SaveVirtualService(host, routes); err != nil {
			return err
		}
	}

	// delete old virtual Service
	for _, vs := range r.virtualServices {
		if hostVirtualService[vs.Spec.Hosts[0]] == nil {
			if err := r.Delete(r.ctx, &vs); err != nil {
				return err
			}
		}
	}

	return nil
}

func (r *HttpRouteReconcilerTask) SaveVirtualService(host string, routes []*istioNetworkingV1Beta1.HTTPRoute) error {
	virtualServiceName := fmt.Sprintf("vs-%s", strings.ReplaceAll(strings.ReplaceAll(host, "*", "wildcard"), ".", "-"))
	virtualServiceNamespace := "kapp-system"

	var virtualService v1beta1.VirtualService

	found := false
	for _, vs := range r.virtualServices {
		if vs.Namespace == virtualServiceNamespace && vs.Name == virtualServiceName {
			virtualService = vs
			found = true
			break
		}
	}

	virtualService.Name = virtualServiceName
	virtualService.Namespace = virtualServiceNamespace

	if virtualService.Labels == nil {
		virtualService.Labels = make(map[string]string)
	}

	virtualService.Labels[KAPP_ROUTE_LABEL] = "true"
	virtualService.Spec.Hosts = []string{host}
	virtualService.Spec.Http = routes
	virtualService.Spec.ExportTo = []string{"*"}
	virtualService.Spec.Gateways = []string{
		"istio-system/istio-ingressgateway",
		fmt.Sprintf("%s/%s", KAPP_GATEWAY_NAMESPACE, KAPP_GATEWAY_NAME),
	}

	if !found {
		if err := r.Create(r.ctx, &virtualService); err != nil {
			r.Log.Error(err, "create virtual service error.")
			return err
		}
	} else {
		if err := r.Update(r.ctx, &virtualService); err != nil {
			r.Log.Error(err, "update virtual service error.")
			return err
		}
	}

	return nil
}

func certCanBeUsedOnDomain(domains []string, host string) bool {
	for _, domain := range domains {
		if strings.ToLower(domain) == strings.ToLower(host) {
			return true
		}

		domainParts := strings.Split(strings.ToLower(domain), ".")
		hostParts := strings.Split(strings.ToLower(host), ".")

		if len(hostParts) == 0 || len(domainParts) == 0 || domainParts[0] != "*" {
			continue
		}

		if slices.CompareSlice(slices.StringsToBytes(domainParts[1:]...), slices.StringsToBytes(hostParts[1:]...)) == 0 {
			return true
		}
	}

	return false
}

func getHttpRouteHttpGatewayName(name string) string {
	return fmt.Sprintf("%s-http-gateway", name)
}

func conditionToStringMatch(condition corev1alpha1.HttpRouteCondition) *istioNetworkingV1Beta1.StringMatch {
	switch condition.Operator {
	case corev1alpha1.HRCOEqual:
		return &istioNetworkingV1Beta1.StringMatch{
			MatchType: &istioNetworkingV1Beta1.StringMatch_Exact{
				Exact: condition.Value,
			},
		}
	case corev1alpha1.HRCOWithPrefix:
		return &istioNetworkingV1Beta1.StringMatch{
			MatchType: &istioNetworkingV1Beta1.StringMatch_Prefix{
				Prefix: condition.Value,
			},
		}
	case corev1alpha1.HRCOMatchRegexp:
		return &istioNetworkingV1Beta1.StringMatch{
			MatchType: &istioNetworkingV1Beta1.StringMatch_Regex{
				Regex: condition.Value,
			},
		}
	}

	return nil
}

func (r *HttpRouteReconcilerTask) PatchConditionsToHttpMatch(match *istioNetworkingV1Beta1.HTTPMatchRequest, route *corev1alpha1.HttpRouteSpec) {
	for _, condition := range route.Conditions {
		switch condition.Type {
		case corev1alpha1.HttpRouteConditionTypeHeader:
			if match.Headers == nil {
				match.Headers = make(map[string]*istioNetworkingV1Beta1.StringMatch)
			}

			match.Headers[http.CanonicalHeaderKey(condition.Name)] = conditionToStringMatch(condition)

		case corev1alpha1.HttpRouteConditionTypeQuery:
			if match.QueryParams == nil {
				match.QueryParams = make(map[string]*istioNetworkingV1Beta1.StringMatch)
			}

			match.QueryParams[condition.Name] = conditionToStringMatch(condition)
		}
	}
}

func isAllowAllMethods(methods []corev1alpha1.HttpRouteMethod) bool {
	if len(methods) < 9 {
		return false
	}

	set := make(map[string]bool, len(methods))

	for _, m := range methods {
		set[string(m)] = true
	}

	return set["GET"] && set["HEAD"] && set["POST"] && set["PUT"] && set["PATCH"] && set["DELETE"] && set["OPTIONS"] && set["TRACE"] && set["CONNECT"]
}

func (r *HttpRouteReconcilerTask) BuildMatches(route *corev1alpha1.HttpRoute) []*istioNetworkingV1Beta1.HTTPMatchRequest {
	spec := &route.Spec
	res := make(
		[]*istioNetworkingV1Beta1.HTTPMatchRequest, 0,
		len(spec.Paths)*len(spec.Methods),
	)

	for _, path := range spec.Paths {
		for _, method := range spec.Methods {
			match := &istioNetworkingV1Beta1.HTTPMatchRequest{
				Method: &istioNetworkingV1Beta1.StringMatch{
					MatchType: &istioNetworkingV1Beta1.StringMatch_Exact{
						Exact: string(method),
					},
				},
			}

			// TODO check the path is a regexp or not.

			// https://github.com/istio/istio/blob/6d6a23d1a644a19cec87d7641c4747135d35692b/pilot/pkg/networking/core/v1alpha3/route/route.go#L1026
			// This is a hack of istio route translation logic, which I think is wrong.
			// The isCacheAllMatch doesn't consider about m.Methods and will ignore all match cases behind.
			// If the path is prefix "/", leave the Uri nil to bypass this logic.
			if path != "/" {
				match.Uri = &istioNetworkingV1Beta1.StringMatch{
					MatchType: &istioNetworkingV1Beta1.StringMatch_Prefix{
						Prefix: path,
					},
				}
			}

			r.PatchConditionsToHttpMatch(match, spec)
			res = append(res, match)
		}
	}

	return res
}

func toHttpRouteDestination(destination corev1alpha1.HttpRouteDestination, weight int32, namespace string) *istioNetworkingV1Beta1.HTTPRouteDestination {
	colon := strings.LastIndexByte(destination.Host, ':')
	var host, port string

	if colon == -1 {
		host = destination.Host
	} else {
		host = destination.Host[:colon]
		port = destination.Host[colon+1:]
	}

	if !strings.Contains(host, ".") {
		host = fmt.Sprintf("%s.%s.svc.cluster.local", host, namespace)
	}

	dest := &istioNetworkingV1Beta1.HTTPRouteDestination{
		Destination: &istioNetworkingV1Beta1.Destination{
			Host: host,
		},
		Weight: weight,
	}

	if port != "" {
		p, _ := strconv.ParseUint(port, 0, 32)
		dest.Destination.Port = &istioNetworkingV1Beta1.PortSelector{
			Number: uint32(p),
		}
	}

	return dest
}

func (r *HttpRouteReconcilerTask) BuildDestinations(route *corev1alpha1.HttpRoute) []*istioNetworkingV1Beta1.HTTPRouteDestination {
	res := make([]*istioNetworkingV1Beta1.HTTPRouteDestination, 0)
	weightSum := 0

	for _, destination := range route.Spec.Destinations {
		weightSum = weightSum + destination.Weight
	}

	for _, destination := range route.Spec.Destinations {
		weight := int32(math.Floor(float64(destination.Weight)/float64(weightSum)*100 + 0.5))
		res = append(res, toHttpRouteDestination(destination, weight, route.Namespace))
	}

	return res
}

// HttpRouteReconciler reconciles a HttpRoute object
type HttpRouteReconciler struct {
	*BaseReconciler
}

// +kubebuilder:rbac:groups=core.kapp.dev,resources=httproutes,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=httproutes/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=networking.istio.io,resources=virtualservices,verbs=*
// +kubebuilder:rbac:groups=networking.istio.io,resources=gateways,verbs=*

func (r *HttpRouteReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	task := &HttpRouteReconcilerTask{
		HttpRouteReconciler: r,
		ctx:                 context.Background(),
	}

	return ctrl.Result{}, task.Run(req)
}

func NewHttpRouteReconciler(mgr ctrl.Manager) *HttpRouteReconciler {
	return &HttpRouteReconciler{NewBaseReconciler(mgr, "HttpRoute")}
}

type WatchAllKappGateway struct{}
type WatchAllKappVirtualService struct{}

func (*WatchAllKappGateway) Map(object handler.MapObject) []reconcile.Request {
	gateway, ok := object.Object.(*v1beta1.Gateway)

	if !ok || gateway.Labels == nil || gateway.Labels[KAPP_ROUTE_LABEL] != "true" {
		return nil
	}

	return []reconcile.Request{{NamespacedName: types.NamespacedName{}}}
}
func (*WatchAllKappVirtualService) Map(object handler.MapObject) []reconcile.Request {
	vs, ok := object.Object.(*v1beta1.VirtualService)

	if !ok || vs.Labels == nil || vs.Labels[KAPP_ROUTE_LABEL] != "true" {
		return nil
	}

	return []reconcile.Request{{NamespacedName: types.NamespacedName{}}}
}

func (r *HttpRouteReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.HttpRoute{}).
		Watches(
			&source.Kind{Type: &v1beta1.Gateway{}},
			&handler.EnqueueRequestsFromMapFunc{
				ToRequests: &WatchAllKappGateway{},
			},
		).
		Watches(
			&source.Kind{Type: &v1beta1.VirtualService{}},
			&handler.EnqueueRequestsFromMapFunc{
				ToRequests: &WatchAllKappVirtualService{},
			},
		).
		Complete(r)
}
