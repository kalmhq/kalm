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
	"math"
	"net/http"
	"sort"
	"strconv"
	"strings"

	protoTypes "github.com/gogo/protobuf/types"
	"istio.io/api/networking/v1alpha3"
	istioNetworkingV1Beta1 "istio.io/api/networking/v1beta1"
	v1alpha32 "istio.io/client-go/pkg/apis/networking/v1alpha3"
	"istio.io/client-go/pkg/apis/networking/v1beta1"
	corev1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
	"sigs.k8s.io/controller-runtime/pkg/source"

	corev1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
	ctrl "sigs.k8s.io/controller-runtime"
)

const (
	KALM_ROUTE_LABEL = "kalm-route"
)

const KALM_SSO_GRANTED_GROUPS_HEADER = "kalm-sso-granted-groups"
const KALM_SSO_GRANTED_EMAILS_HEADER = "kalm-sso-granted-emails"
const KALM_SSO_USERINFO_HEADER = "kalm-sso-userinfo"
const KALM_SSO_SET_COOKIE_PAYLOAD_HEADER = "kalm-set-cookie"
const KALM_ROUTE_HEADER = "kalm-route"
const KALM_ALLOW_TO_PASS_IF_HAS_BEARER_TOKEN_HEADER = "allow-to-pass-if-has-bearer-token"

const KALM_AUTH_EMAIL = "kalm-auth-email"

var DANGEROUS_HEADERS = []string{
	KALM_SSO_USERINFO_HEADER,
	KALM_ALLOW_TO_PASS_IF_HAS_BEARER_TOKEN_HEADER,
	KALM_ROUTE_HEADER,
	KALM_SSO_SET_COOKIE_PAYLOAD_HEADER,
	KALM_AUTH_EMAIL,
}

type HttpRouteReconcilerTask struct {
	*HttpRouteReconciler
	ctx                       context.Context
	routes                    []corev1alpha1.HttpRoute
	gateways                  []v1beta1.Gateway
	virtualServices           []v1beta1.VirtualService
	httpsRedirectEnvoyFilters []v1alpha32.EnvoyFilter
}

func getIstioHttpRouteName(route *corev1alpha1.HttpRoute) string {
	return fmt.Sprintf("kalm-route-%s", route.Name)
}

func getHttpsRedirectEnvoyFilterName(route *corev1alpha1.HttpRoute) string {
	return fmt.Sprintf("https-redirect-%s", route.Name)
}

// will not care about match
func (r *HttpRouteReconcilerTask) buildIstioHttpRoute(route *corev1alpha1.HttpRoute) *istioNetworkingV1Beta1.HTTPRoute {
	spec := &route.Spec
	httpRoute := &istioNetworkingV1Beta1.HTTPRoute{
		Name:  getIstioHttpRouteName(route),
		Route: r.BuildDestinations(route),
		Headers: &istioNetworkingV1Beta1.Headers{
			Request: &istioNetworkingV1Beta1.Headers_HeaderOperations{
				Remove: DANGEROUS_HEADERS,
				Set: map[string]string{
					KALM_ROUTE_HEADER: "true",
				},
			},
		},
	}

	if spec.StripPath {
		httpRoute.Rewrite = &istioNetworkingV1Beta1.HTTPRewrite{
			Uri: "/",
		}
	}

	// Disable 5s timeout bug
	// if spec.Timeout != nil {
	// 	httpRoute.Timeout = &protoTypes.Duration{
	// 		Seconds: int64(*spec.Timeout),
	// 	}
	// }

	// if spec.Retries != nil {
	// 	httpRoute.Retries = &istioNetworkingV1Beta1.HTTPRetry{
	// 		Attempts: int32(spec.Retries.Attempts),
	// 		PerTryTimeout: &protoTypes.Duration{
	// 			Seconds: int64(spec.Retries.PerTtyTimeoutSeconds),
	// 		},
	// 		RetryOn: strings.Join(spec.Retries.RetryOn, ","),
	// 	}
	// }

	if spec.Mirror != nil {
		dest := toHttpRouteDestination(spec.Mirror.Destination, 100)
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
				FixedDelay: &protoTypes.Duration{
					Seconds: int64(spec.Delay.DelaySeconds),
				},
			},
		}
	}

	if spec.CORS != nil {
		httpRoute.CorsPolicy = &istioNetworkingV1Beta1.CorsPolicy{}

		if spec.CORS.AllowOrigins != nil {
			allowOrigins := make([]*istioNetworkingV1Beta1.StringMatch, 0, len(spec.CORS.AllowOrigins))

			for _, origin := range spec.CORS.AllowOrigins {
				allowOrigins = append(allowOrigins, &istioNetworkingV1Beta1.StringMatch{
					MatchType: &istioNetworkingV1Beta1.StringMatch_Exact{
						Exact: origin,
					},
				})
			}

			httpRoute.CorsPolicy.AllowOrigins = allowOrigins
		}

		if spec.CORS.AllowMethods != nil {
			httpRoute.CorsPolicy.AllowMethods = spec.CORS.AllowMethods
		}

		if spec.CORS.AllowHeaders != nil {
			httpRoute.CorsPolicy.AllowHeaders = spec.CORS.AllowHeaders
		}

		if spec.CORS.MaxAgeSeconds != nil {
			httpRoute.CorsPolicy.MaxAge = &protoTypes.Duration{
				Seconds: int64(*spec.CORS.MaxAgeSeconds),
			}
		}

		httpRoute.CorsPolicy.AllowCredentials = &protoTypes.BoolValue{
			Value: spec.CORS.AllowCredentials,
		}
	}

	return httpRoute

}

// Kalm route level http to https redirect is achieved by adding envoy filter for istio ingress gateway
//
func (r *HttpRouteReconcilerTask) buildHttpsRedirectEnvoyFilter(route *corev1alpha1.HttpRoute) (*v1alpha32.EnvoyFilter, error) {

	filter := &v1alpha32.EnvoyFilter{
		ObjectMeta: metaV1.ObjectMeta{
			Namespace: istioNamespace,
			Name:      getHttpsRedirectEnvoyFilterName(route),
			Labels: map[string]string{
				KALM_ROUTE_LABEL: "true",
			},
		},
		Spec: v1alpha3.EnvoyFilter{
			WorkloadSelector: &v1alpha3.WorkloadSelector{
				Labels: map[string]string{
					"app": "istio-ingressgateway",
				},
			},
			ConfigPatches: []*v1alpha3.EnvoyFilter_EnvoyConfigObjectPatch{
				{
					ApplyTo: v1alpha3.EnvoyFilter_HTTP_ROUTE,
					Match: &v1alpha3.EnvoyFilter_EnvoyConfigObjectMatch{
						Context: v1alpha3.EnvoyFilter_GATEWAY,
						ObjectTypes: &v1alpha3.EnvoyFilter_EnvoyConfigObjectMatch_RouteConfiguration{
							RouteConfiguration: &v1alpha3.EnvoyFilter_RouteConfigurationMatch{
								PortNumber: 80,
								Vhost: &v1alpha3.EnvoyFilter_RouteConfigurationMatch_VirtualHostMatch{
									Route: &v1alpha3.EnvoyFilter_RouteConfigurationMatch_RouteMatch{
										Name: getIstioHttpRouteName(route),
									},
								},
							},
						},
					},
					Patch: &v1alpha3.EnvoyFilter_Patch{
						Operation: v1alpha3.EnvoyFilter_Patch_MERGE,
						Value: golangMapToProtoStruct(map[string]interface{}{
							"redirect": map[string]interface{}{
								"https_redirect": true,
							},
						}),
					},
				},
			},
		},
	}

	// TODO route and filter are in different namespace. Can't set owner relationship for them.
	// This part will be removed or uncomment after we have a decision of http route scope.

	//if err := ctrl.SetControllerReference(route, filter, r.Scheme); err != nil {
	//	r.EmitWarningEvent(route, err, "unable to set owner for https redirect envoy filter")
	//	return nil, err
	//}

	return filter, nil
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
	if err := r.Reader.List(r.ctx, &virtualServices, client.MatchingLabels{KALM_ROUTE_LABEL: "true"}); err != nil {
		return err
	}
	r.virtualServices = virtualServices.Items

	var httpsRedirectEnvoyFilters v1alpha32.EnvoyFilterList
	if err := r.Reader.List(r.ctx, &httpsRedirectEnvoyFilters, client.MatchingLabels{KALM_ROUTE_LABEL: "true"}); err != nil {
		return err
	}
	r.httpsRedirectEnvoyFilters = httpsRedirectEnvoyFilters.Items

	// Each host will has a virtual service
	// Kalm will order http route rules, and set them in the virtual service http field.
	hostVirtualService := make(map[string][]*istioNetworkingV1Beta1.HTTPRoute)

	for i := range r.routes {
		route := r.routes[i]

		for j := range route.Spec.Hosts {
			host := route.Spec.Hosts[j]

			if _, ok := hostVirtualService[host]; ok {
				hostVirtualService[host] = append(hostVirtualService[host], r.buildIstioHttpRoutes(&route)...)
			} else {
				hostVirtualService[host] = r.buildIstioHttpRoutes(&route)
			}
		}
	}

	var serviceList corev1.ServiceList
	if err := r.Reader.List(r.ctx, &serviceList); err != nil {
		return err
	}
	hostsMap := make(map[string]bool)
	for _, service := range serviceList.Items {
		for _, servicePort := range service.Spec.Ports {
			host := service.Name + "." + service.Namespace + ".svc.cluster.local:" + fmt.Sprint(servicePort.Port)
			hostsMap[host] = true

			if servicePort.Protocol == corev1.ProtocolTCP && servicePort.Port == 80 {
				host := service.Name + "." + service.Namespace + ".svc.cluster.local"
				hostsMap[host] = true
			}
		}
	}

	for i := range r.routes {
		route := r.routes[i]
		if len(route.Status.DestinationsStatus) != len(route.Spec.Destinations) {
			route.Status.DestinationsStatus = make([]corev1alpha1.HttpRouteDestinationStatus, len(route.Spec.Destinations))
		}
		for j := range route.Spec.Destinations {
			destination := route.Spec.Destinations[j]
			_, matchedTarget := hostsMap[destination.Host]
			if matchedTarget {
				route.Status.DestinationsStatus[j] = corev1alpha1.HttpRouteDestinationStatus{
					DestinationHost: destination.Host,
					Status:          "normal",
					Error:           "",
				}
			} else {
				route.Status.DestinationsStatus[j] = corev1alpha1.HttpRouteDestinationStatus{
					DestinationHost: destination.Host,
					Status:          "error",
					Error:           "No HttpRoute destination matched",
				}

			}
		}
		r.Status().Update(r.ctx, &route)
	}

	for host, routes := range hostVirtualService {
		// Less reports whether the element with
		// index i should sort before the element with index j.
		sort.Slice(routes, func(i, j int) bool { return sortRoutes(routes[i], routes[j]) })

		if err := r.SaveVirtualService(host, routes); err != nil {
			return err
		}
	}

	httpsRedirectFilterMap := make(map[string]*v1alpha32.EnvoyFilter)

	for i := range r.httpsRedirectEnvoyFilters {
		filter := r.httpsRedirectEnvoyFilters[i]
		httpsRedirectFilterMap[filter.Name] = &filter
	}

	// Create or delete envoy filter on gateway for routes
	for i := range r.routes {
		route := r.routes[i]

		filterName := getHttpsRedirectEnvoyFilterName(&route)
		if route.Spec.HttpRedirectToHttps {
			if _, ok := httpsRedirectFilterMap[filterName]; !ok {
				filter, err := r.buildHttpsRedirectEnvoyFilter(&route)

				if err != nil {
					return err
				}

				if err := r.Create(r.ctx, filter); err != nil {
					r.EmitWarningEvent(&route, err, "Create Https Redirect filter Error")
					return err
				}
			} else {
				delete(httpsRedirectFilterMap, filterName)
			}
		}
	}

	// clean left unused envoy filters
	for filterName := range httpsRedirectFilterMap {
		filter := httpsRedirectFilterMap[filterName]

		if err := r.Delete(r.ctx, filter); err != nil {
			return err
		}
	}

	// delete old virtual Service
	for i := range r.virtualServices {
		vs := r.virtualServices[i]

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
	virtualServiceNamespace := "kalm-system"

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

	virtualService.Labels[KALM_ROUTE_LABEL] = "true"
	virtualService.Spec.Hosts = []string{host}
	virtualService.Spec.Http = routes
	virtualService.Spec.ExportTo = []string{"*"}
	virtualService.Spec.Gateways = []string{
		HTTP_GATEWAY_NAMESPACED_NAME.String(),
		HTTPS_GATEWAY_NAMESPACED_NAME.String(),
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

		if strings.Join(domainParts[1:], ".") == strings.Join(hostParts[1:], ".") {
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
		var methodRegexp strings.Builder
		methodRegexp.WriteString("^(")

		for i, method := range spec.Methods {
			methodRegexp.WriteString(string(method))

			if i < len(spec.Methods)-1 {
				methodRegexp.WriteString("|")
			}
		}

		methodRegexp.WriteString(")$")

		match := &istioNetworkingV1Beta1.HTTPMatchRequest{
			Method: &istioNetworkingV1Beta1.StringMatch{
				MatchType: &istioNetworkingV1Beta1.StringMatch_Regex{
					Regex: methodRegexp.String(),
				},
			},
		}

		match.Gateways = make([]string, 0, 2)

		for _, scheme := range spec.Schemes {
			if scheme == "http" {
				match.Gateways = append(
					match.Gateways,
					HTTP_GATEWAY_NAMESPACED_NAME.String(),
				)
			} else if scheme == "https" {
				match.Gateways = append(
					match.Gateways,
					HTTPS_GATEWAY_NAMESPACED_NAME.String(),
				)
			}
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

		// Prevent double slash after strip path rewrite
		// Assume we have a route that enabled strip path and has a path prefix with /bbbb
		//   Request #1 with path /bbbbaaaa will be rewritten to /aaaa, this is CORRECT
		//   Request #2 with path /bbbb/aaaa will be rewritten to //aaaa, which has double slashes and it is WRONG
		// To solve this, add another route with path prefix /bbbb/
		//   Request #1 doesn't match this route. Skip
		//   Request #2 will be rewritten to /aaaa, which is correct.
		if route.Spec.StripPath && path != "/" {
			copyedMatch := match.DeepCopy()

			copyedMatch.Uri = &istioNetworkingV1Beta1.StringMatch{
				MatchType: &istioNetworkingV1Beta1.StringMatch_Prefix{
					Prefix: path + "/",
				},
			}

			res = append(res, copyedMatch)
		}
	}

	return res
}

func toHttpRouteDestination(destination corev1alpha1.HttpRouteDestination, weight int32) *istioNetworkingV1Beta1.HTTPRouteDestination {
	colon := strings.LastIndexByte(destination.Host, ':')
	var host, port string

	if colon == -1 {
		host = destination.Host
	} else {
		host = destination.Host[:colon]
		port = destination.Host[colon+1:]
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

	weights := adjustDestinationWeightToSumTo100(route.Spec.Destinations)
	for i, destination := range route.Spec.Destinations {
		weight := weights[i]
		res = append(res, toHttpRouteDestination(destination, weight))
	}

	return res
}

func adjustDestinationWeightToSumTo100(destinations []corev1alpha1.HttpRouteDestination) []int32 {
	var originWeights []int
	for _, destination := range destinations {
		originWeights = append(originWeights, destination.Weight)
	}

	return adjustWeightToSumTo100(originWeights)
}

func adjustWeightToSumTo100(originWeights []int) []int32 {
	var rst []int32

	var weightSum int
	for _, w := range originWeights {
		weightSum += w
	}

	for _, originWeight := range originWeights {
		weight := int32(math.Floor(float64(originWeight)/float64(weightSum)*100 + 0.5))
		rst = append(rst, weight)
	}

	total := sum(rst)
	if total != 100 {
		diff := 100 - total

		//fmt.Printf("adjust, %d + %d, %v", total, diff, rst)
		adjustBiggestWeight(rst, diff)
	}

	return rst
}

func adjustBiggestWeight(rst []int32, diff int32) {
	if len(rst) <= 0 {
		return
	}

	var maxIdx int
	for i := 0; i < len(rst); i++ {
		if rst[i] <= rst[maxIdx] {
			continue
		}

		maxIdx = i
	}

	rst[maxIdx] += diff
}

func sum(nums []int32) int32 {
	var rst int32
	for _, num := range nums {
		rst += num
	}
	return rst
}

// HttpRouteReconciler reconciles a HttpRoute object
type HttpRouteReconciler struct {
	*BaseReconciler
}

// +kubebuilder:rbac:groups=core.kalm.dev,resources=httproutes,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kalm.dev,resources=httproutes/status,verbs=get;update;patch
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

type WatchAllKalmGateway struct{}
type WatchAllKalmVirtualService struct{}
type WatchAllKalmEnvoyFilter struct{}
type WatchAllService struct{}

func (*WatchAllKalmGateway) Map(object handler.MapObject) []reconcile.Request {
	gateway, ok := object.Object.(*v1beta1.Gateway)

	if !ok || gateway.Labels == nil || gateway.Labels[KALM_ROUTE_LABEL] != "true" {
		return nil
	}

	return []reconcile.Request{{NamespacedName: types.NamespacedName{}}}
}
func (*WatchAllKalmVirtualService) Map(object handler.MapObject) []reconcile.Request {
	vs, ok := object.Object.(*v1beta1.VirtualService)

	if !ok || vs.Labels == nil || vs.Labels[KALM_ROUTE_LABEL] != "true" {
		return nil
	}

	return []reconcile.Request{{NamespacedName: types.NamespacedName{}}}
}
func (*WatchAllKalmEnvoyFilter) Map(object handler.MapObject) []reconcile.Request {
	vs, ok := object.Object.(*v1alpha32.EnvoyFilter)
	if !ok || vs.Labels == nil || vs.Labels[KALM_ROUTE_LABEL] != "true" {
		return nil
	}
	return []reconcile.Request{{NamespacedName: types.NamespacedName{}}}
}
func (*WatchAllService) Map(object handler.MapObject) []reconcile.Request {
	_, ok := object.Object.(*corev1.Service)
	if !ok {
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
				ToRequests: &WatchAllKalmGateway{},
			},
		).
		Watches(
			&source.Kind{Type: &v1beta1.VirtualService{}},
			&handler.EnqueueRequestsFromMapFunc{
				ToRequests: &WatchAllKalmVirtualService{},
			},
		).
		Watches(
			&source.Kind{Type: &v1alpha32.EnvoyFilter{}},
			&handler.EnqueueRequestsFromMapFunc{
				ToRequests: &WatchAllKalmEnvoyFilter{},
			},
		).
		Watches(
			&source.Kind{Type: &corev1.Service{}},
			&handler.EnqueueRequestsFromMapFunc{
				ToRequests: &WatchAllService{},
			},
		).
		Complete(r)
}
