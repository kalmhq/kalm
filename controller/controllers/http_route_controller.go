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
	"github.com/kapp-staging/kapp/controller/utils"
	istioNetworkingV1Beta1 "istio.io/api/networking/v1beta1"
	"istio.io/client-go/pkg/apis/networking/v1beta1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/types"
	"net/http"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"strconv"
	"strings"

	corev1alpha1 "github.com/kapp-staging/kapp/controller/api/v1alpha1"
	ctrl "sigs.k8s.io/controller-runtime"
)

const (
	DEFAULT_HTTPS_CERT_NAME = "default-https-cert"
)

type HttpRouteReconcilerTask struct {
	*HttpRouteReconciler
	ctx   context.Context
	route *corev1alpha1.HttpRoute
	gw    *v1beta1.Gateway
	vs    *v1beta1.VirtualService
}

func (r *HttpRouteReconcilerTask) WarningEvent(err error, msg string, args ...interface{}) {
	r.EmitWarningEvent(r.route, err, msg, args...)
}

func (r *HttpRouteReconcilerTask) NormalEvent(reason, msg string, args ...interface{}) {
	r.EmitNormalEvent(r.route, reason, msg, args...)
}

func (r *HttpRouteReconcilerTask) Run(req ctrl.Request) error {
	if err := r.Reader.Get(r.ctx, req.NamespacedName, r.route); err != nil {
		return client.IgnoreNotFound(err)
	}

	if err := r.ReconcileGateway(req); err != nil {
		r.WarningEvent(err, "reconcile gateways error.")
		return err
	}

	if err := r.ReconcileVirtualService(req); err != nil {
		r.WarningEvent(err, "reconcile virtual service error.")
		return err
	}

	//if err := r.UpdateStatus(); err != nil {
	//	r.WarningEvent(err, "update Status error.")
	//	return err
	//}

	return nil
}

//func (r *HttpRouteReconcilerTask) UpdateStatus() error {
//	copyedRoute := r.route.DeepCopy()
//	copyedRoute.Status.HostCertifications = make(map[string]string)
//
//	for _, server := range r.gw.Spec.Servers {
//		if server.Tls == nil {
//			continue
//		}
//
//		if server.Tls.CredentialName == "" {
//			continue
//		}
//
//		for _, host := range server.Hosts {
//			copyedRoute.Status.HostCertifications[host] = server.Tls.CredentialName
//		}
//	}
//
//	if err := r.Status().Patch(r.ctx, copyedRoute, client.MergeFrom(r.route)); err != nil {
//		r.WarningEvent(err, "Patch http route status error.")
//		return err
//	}
//
//	return nil
//}

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

func (r *HttpRouteReconcilerTask) ReconcileGateway(req ctrl.Request) error {
	gwName := getHttpRouteHttpGatewayName(req.Name)
	var isGatewayMissing bool
	if err := r.Reader.Get(r.ctx, types.NamespacedName{
		Name:      gwName,
		Namespace: req.Namespace,
	}, r.gw); err != nil {
		if errors.IsNotFound(err) {
			isGatewayMissing = true
		} else {
			r.WarningEvent(err, "get gateway error.")
		}
	}

	gw := r.gw
	gw.Name = gwName
	gw.Namespace = req.Namespace

	if gw.Spec.Selector == nil {
		gw.Spec.Selector = make(map[string]string)
	}

	gw.Spec.Selector["istio"] = "ingressgateway"
	gw.Spec.Servers = []*istioNetworkingV1Beta1.Server{}

	if utils.ContainsString(r.route.Spec.Schemes, "http") {
		server := &istioNetworkingV1Beta1.Server{
			Hosts: r.route.Spec.Hosts,
			Port: &istioNetworkingV1Beta1.Port{
				Number:   80,
				Protocol: "HTTP",
				Name:     "http",
			},
		}

		if utils.ContainsString(r.route.Spec.Schemes, "https") && r.route.Spec.HttpRedirectToHttps {
			server.Tls = &istioNetworkingV1Beta1.Server_TLSOptions{
				HttpsRedirect: true,
			}
		}

		gw.Spec.Servers = append(gw.Spec.Servers, server)
	} else {
		if !isGatewayMissing {
			if err := r.Delete(r.ctx, gw); err != nil {
				r.WarningEvent(err, "delete gateway error.")
				return err
			}
		}

		r.gw = nil
		return nil
	}

	if err := ctrl.SetControllerReference(r.route, gw, r.Scheme); err != nil {
		return err
	}

	if isGatewayMissing {
		if err := r.Create(r.ctx, gw); err != nil {
			r.WarningEvent(err, "create virtual service error.")
			return err
		}
	} else {
		if err := r.Update(r.ctx, gw); err != nil {
			r.WarningEvent(err, "update virtual service error.")
			return err
		}
	}

	return nil
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

func (r *HttpRouteReconcilerTask) PatchConditionsToHttpMatch(match *istioNetworkingV1Beta1.HTTPMatchRequest) {
	for _, condition := range r.route.Spec.Conditions {
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

func (r *HttpRouteReconcilerTask) BuildMatches() []*istioNetworkingV1Beta1.HTTPMatchRequest {
	res := make(
		[]*istioNetworkingV1Beta1.HTTPMatchRequest, 0,
		len(r.route.Spec.Paths)*len(r.route.Spec.Methods),
	)

	for _, path := range r.route.Spec.Paths {
		for _, method := range r.route.Spec.Methods {
			match := &istioNetworkingV1Beta1.HTTPMatchRequest{
				Uri: &istioNetworkingV1Beta1.StringMatch{
					MatchType: &istioNetworkingV1Beta1.StringMatch_Prefix{
						Prefix: path,
					},
				},
				Method: &istioNetworkingV1Beta1.StringMatch{
					MatchType: &istioNetworkingV1Beta1.StringMatch_Exact{
						Exact: string(method),
					},
				},
			}

			r.PatchConditionsToHttpMatch(match)
			res = append(res, match)
		}
	}

	return res
}

func toHttpRouteDestination(destination corev1alpha1.HttpRouteDestination) *istioNetworkingV1Beta1.HTTPRouteDestination {
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
		Weight: int32(destination.Weight),
	}

	if port != "" {
		p, _ := strconv.ParseUint(port, 0, 32)
		dest.Destination.Port = &istioNetworkingV1Beta1.PortSelector{
			Number: uint32(p),
		}
	}

	return dest
}

func (r *HttpRouteReconcilerTask) BuildDestinations() []*istioNetworkingV1Beta1.HTTPRouteDestination {
	res := make([]*istioNetworkingV1Beta1.HTTPRouteDestination, 0)

	for _, destination := range r.route.Spec.Destinations {
		res = append(res, toHttpRouteDestination(destination))
	}

	return res
}

func (r *HttpRouteReconcilerTask) ReconcileVirtualService(req ctrl.Request) error {
	var isCreate bool
	if err := r.Reader.Get(r.ctx, req.NamespacedName, r.vs); err != nil {
		if !errors.IsNotFound(err) {
			r.WarningEvent(err, "get virtual service error.")
			return err
		}

		isCreate = true
	}

	httpRoute := &istioNetworkingV1Beta1.HTTPRoute{

		Match: r.BuildMatches(),
		Route: r.BuildDestinations(),
	}

	if r.route.Spec.StripPath {
		httpRoute.Rewrite = &istioNetworkingV1Beta1.HTTPRewrite{
			Uri: "/",
		}
	}

	if r.route.Spec.Timeout != nil {
		httpRoute.Timeout = &pbTypes.Duration{
			Seconds: int64(*r.route.Spec.Timeout),
		}
	}

	if r.route.Spec.Retries != nil {
		httpRoute.Retries = &istioNetworkingV1Beta1.HTTPRetry{
			Attempts: int32(r.route.Spec.Retries.Attempts),
			PerTryTimeout: &pbTypes.Duration{
				Seconds: int64(r.route.Spec.Retries.PerTtyTimeoutSeconds),
			},
			RetryOn: strings.Join(r.route.Spec.Retries.RetryOn, ","),
		}
	}

	if r.route.Spec.Mirror != nil {
		dest := toHttpRouteDestination(r.route.Spec.Mirror.Destination)
		httpRoute.Mirror = dest.Destination
		httpRoute.MirrorPercentage = &istioNetworkingV1Beta1.Percent{
			Value: float64(r.route.Spec.Mirror.Percentage),
		}
	}

	if r.route.Spec.Fault != nil {
		if httpRoute.Fault == nil {
			httpRoute.Fault = &istioNetworkingV1Beta1.HTTPFaultInjection{}
		}

		httpRoute.Fault.Abort = &istioNetworkingV1Beta1.HTTPFaultInjection_Abort{
			ErrorType: &istioNetworkingV1Beta1.HTTPFaultInjection_Abort_HttpStatus{
				HttpStatus: int32(r.route.Spec.Fault.ErrorStatus),
			},
			Percentage: &istioNetworkingV1Beta1.Percent{
				Value: float64(r.route.Spec.Fault.Percentage),
			},
		}
	}

	if r.route.Spec.Delay != nil {
		if httpRoute.Fault == nil {
			httpRoute.Fault = &istioNetworkingV1Beta1.HTTPFaultInjection{}
		}

		httpRoute.Fault.Delay = &istioNetworkingV1Beta1.HTTPFaultInjection_Delay{
			Percentage: &istioNetworkingV1Beta1.Percent{
				Value: float64(r.route.Spec.Delay.Percentage),
			},
			HttpDelayType: &istioNetworkingV1Beta1.HTTPFaultInjection_Delay_FixedDelay{
				FixedDelay: &pbTypes.Duration{
					Seconds: int64(r.route.Spec.Delay.DelaySeconds),
				},
			},
		}
	}

	if r.route.Spec.CORS != nil {
		httpRoute.CorsPolicy = &istioNetworkingV1Beta1.CorsPolicy{
			AllowOrigins: make([]*istioNetworkingV1Beta1.StringMatch, 0, len(r.route.Spec.CORS.AllowOrigins)),
			AllowMethods: r.route.Spec.CORS.AllowMethods,
			AllowHeaders: r.route.Spec.CORS.AllowHeaders,
			MaxAge: &pbTypes.Duration{
				Seconds: int64(r.route.Spec.CORS.MaxAgeSeconds),
			},
		}

		for _, condition := range r.route.Spec.CORS.AllowOrigins {
			httpRoute.CorsPolicy.AllowOrigins = append(httpRoute.CorsPolicy.AllowOrigins, conditionToStringMatch(condition))
		}
	}

	r.vs.Name = r.route.Name
	r.vs.Namespace = r.route.Namespace

	r.vs.Spec = istioNetworkingV1Beta1.VirtualService{
		Gateways: []string{},
		Hosts:    r.route.Spec.Hosts,
		Http:     []*istioNetworkingV1Beta1.HTTPRoute{httpRoute},
		ExportTo: []string{"*"},
	}

	// allow http
	if r.gw != nil {
		r.vs.Spec.Gateways = append(r.vs.Spec.Gateways, r.gw.Name)
	}

	// allow https
	if utils.ContainsString(r.route.Spec.Schemes, "https") {
		r.vs.Spec.Gateways = append(
			r.vs.Spec.Gateways,
			fmt.Sprintf("%s/%s", KAPP_GATEWAY_NAMESPACE, KAPP_GATEWAY_NAME),
		)
	}

	if err := ctrl.SetControllerReference(r.route, r.vs, r.Scheme); err != nil {
		return err
	}

	if isCreate {
		if err := r.Create(r.ctx, r.vs); err != nil {
			r.WarningEvent(err, "create virtual service error.")
			return err
		}
	} else {
		if err := r.Update(r.ctx, r.vs); err != nil {
			r.WarningEvent(err, "update virtual service error.")
			return err
		}
	}

	return nil
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
		route:               &corev1alpha1.HttpRoute{},
		gw:                  &v1beta1.Gateway{},
		vs:                  &v1beta1.VirtualService{},
	}

	return ctrl.Result{}, task.Run(req)
}

func NewHttpRouteReconciler(mgr ctrl.Manager) *HttpRouteReconciler {
	return &HttpRouteReconciler{NewBaseReconciler(mgr, "HttpRoute")}
}

func (r *HttpRouteReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.HttpRoute{}).
		Owns(&v1beta1.Gateway{}).
		Owns(&v1beta1.VirtualService{}).
		Complete(r)
}
