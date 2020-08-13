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
	protoTypes "github.com/gogo/protobuf/types"
	corev1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
	v1alpha32 "istio.io/api/networking/v1alpha3"
	v1beta12 "istio.io/api/security/v1beta1"
	v1beta13 "istio.io/api/type/v1beta1"
	"istio.io/client-go/pkg/apis/networking/v1alpha3"
	"istio.io/client-go/pkg/apis/security/v1beta1"
	"k8s.io/apimachinery/pkg/api/errors"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
	"sigs.k8s.io/controller-runtime/pkg/source"
	"strconv"
	"strings"
)

// ProtectedEndpointReconciler reconciles a SingleSignOnConfig object
type ProtectedEndpointReconciler struct {
	*BaseReconciler
}

type ProtectedEndpointReconcilerTask struct {
	*ProtectedEndpointReconciler
	ctx                   context.Context
	endpoint              *corev1alpha1.ProtectedEndpoint
	ssoConfig             *corev1alpha1.SingleSignOnConfig
	envoyFilter           *v1alpha3.EnvoyFilter
	authorizationPolicy   *v1beta1.AuthorizationPolicy
	requestAuthentication *v1beta1.RequestAuthentication
}

func (r *ProtectedEndpointReconcilerTask) LoadResources(req ctrl.Request) error {

	name := fmt.Sprintf("kalm-sso-%s", req.Name)

	var authorizationPolicy v1beta1.AuthorizationPolicy
	err := r.Get(r.ctx, types.NamespacedName{
		Name:      name,
		Namespace: req.Namespace,
	}, &authorizationPolicy)

	if err != nil {
		if !errors.IsNotFound(err) {
			r.Log.Error(err, "get authorizationPolicy failed.")
			return err
		}
	} else {
		r.authorizationPolicy = &authorizationPolicy
	}

	var envoyFilter v1alpha3.EnvoyFilter
	err = r.Get(r.ctx, types.NamespacedName{
		Name:      name,
		Namespace: req.Namespace,
	}, &envoyFilter)

	if err != nil {
		if !errors.IsNotFound(err) {
			r.Log.Error(err, "get envoyFilter failed.")
			return err
		}
	} else {
		r.envoyFilter = &envoyFilter
	}

	var requestAuthentication v1beta1.RequestAuthentication
	err = r.Get(r.ctx, types.NamespacedName{
		Name:      name,
		Namespace: req.Namespace,
	}, &requestAuthentication)

	if err != nil {
		if !errors.IsNotFound(err) {
			r.Log.Error(err, "get requestAuthentication failed.")
			return err
		}
	} else {
		r.requestAuthentication = &requestAuthentication
	}

	return nil
}

func (r *ProtectedEndpointReconcilerTask) Run(req ctrl.Request) error {
	var endpoint corev1alpha1.ProtectedEndpoint

	if err := r.Get(r.ctx, req.NamespacedName, &endpoint); err != nil {
		if errors.IsNotFound(err) {
			return nil
		}

		r.Log.Error(err, "get protected endpoint failed.")
		return err
	}

	r.endpoint = &endpoint

	var ssoList corev1alpha1.SingleSignOnConfigList

	if err := r.Reader.List(r.ctx, &ssoList); err != nil {
		r.Log.Error(err, "List sso error.")
		return err
	}

	if len(ssoList.Items) == 0 {
		r.Log.Info("No sso config, skip.")
		return r.DeleteResources()
	}

	if len(ssoList.Items) > 1 {
		r.Log.Error(
			fmt.Errorf("Only one SSO config is allowed."),
			"Found more than one SSO configs, Please keep single one and delete the others.",
		)
		return nil
	}

	r.ssoConfig = &ssoList.Items[0]

	if err := r.LoadResources(req); err != nil {
		r.Log.Error(err, "Load resources error")
		return err
	}

	return r.ReconcileResources(req)
}

func (r *ProtectedEndpointReconcilerTask) DeleteResources() error {
	if r.envoyFilter != nil {
		if err := r.Delete(r.ctx, r.envoyFilter); err != nil {
			r.Log.Error(err, "delete envoyFilter error")
			return err
		}
	}

	if r.authorizationPolicy != nil {
		if err := r.Delete(r.ctx, r.authorizationPolicy); err != nil {
			r.Log.Error(err, "delete authorizationPolicy error")
			return err
		}
	}

	if r.requestAuthentication != nil {
		if err := r.Delete(r.ctx, r.requestAuthentication); err != nil {
			r.Log.Error(err, "delete requestAuthentication error")
			return err
		}
	}

	return nil
}

type OIDCProviderInfo struct {
	Issuer                            string
	JwksURI                           string
	AuthProxyInternalUrl              string
	AuthProxyExternalUrl              string
	AuthProxyInternalEnvoyClusterName string
}

func GetOIDCProviderInfo(ssoConfig *corev1alpha1.SingleSignOnConfig) *OIDCProviderInfo {
	info := &OIDCProviderInfo{}
	spec := ssoConfig.Spec

	var scheme string
	var port string

	if spec.Issuer != "" {
		info.Issuer = spec.Issuer
		info.JwksURI = spec.JwksURI
	} else {
		if spec.UseHttp {
			scheme = "http"
		} else {
			scheme = "https"
		}

		if spec.Port != nil {
			port = ":" + strconv.Itoa(*spec.Port)
		}

		info.Issuer = fmt.Sprintf("%s://%s%s/dex", scheme, spec.Domain, port)
		info.JwksURI = fmt.Sprintf("%s/keys", info.Issuer)
	}

	if spec.ExternalEnvoyExtAuthz != nil {
		info.AuthProxyExternalUrl = fmt.Sprintf("%s://%s:%d", spec.ExternalEnvoyExtAuthz.Scheme, spec.ExternalEnvoyExtAuthz.Host, spec.ExternalEnvoyExtAuthz.Port)
		info.AuthProxyInternalUrl = info.AuthProxyExternalUrl
		info.AuthProxyInternalEnvoyClusterName = fmt.Sprintf("outbound|%d||%s", spec.ExternalEnvoyExtAuthz.Port, spec.ExternalEnvoyExtAuthz.Host)
	} else {
		info.AuthProxyExternalUrl = fmt.Sprintf("%s://%s%s", scheme, spec.Domain, port)
		info.AuthProxyInternalUrl = fmt.Sprint("http://auth-proxy.kalm-system.svc.cluster.local")
		info.AuthProxyInternalEnvoyClusterName = "outbound|80||auth-proxy.kalm-system.svc.cluster.local"
	}

	return info
}

func (r *ProtectedEndpointReconcilerTask) BuildEnvoyFilter(req ctrl.Request) *v1alpha3.EnvoyFilter {
	name := fmt.Sprintf("kalm-sso-%s", req.Name)
	namespace := req.Namespace
	oidcProviderInfo := GetOIDCProviderInfo(r.ssoConfig)

	var grantedGroups string
	if len(r.endpoint.Spec.Groups) > 0 {
		grantedGroups = strings.Join(r.endpoint.Spec.Groups, "|")
	}

	patch := &v1alpha32.EnvoyFilter_Patch{
		Operation: v1alpha32.EnvoyFilter_Patch_INSERT_BEFORE,
		Value: golangMapToProtoStruct(map[string]interface{}{
			"name": "envoy.ext_authz",
			"config": map[string]interface{}{
				"httpService": map[string]interface{}{
					"serverUri": map[string]interface{}{
						"uri":     oidcProviderInfo.AuthProxyInternalUrl + "/ext_authz",
						"cluster": oidcProviderInfo.AuthProxyInternalEnvoyClusterName,
						"timeout": "1s",
					},
					"path_prefix": "/ext_authz",
					"authorizationRequest": map[string]interface{}{
						"allowedHeaders": map[string]interface{}{
							"patterns": []interface{}{
								map[string]interface{}{
									"exact": "cookie",
								},
								map[string]interface{}{
									"exact": "x-envoy-original-path",
								},
							},
						},
						"headersToAdd": []interface{}{
							map[string]interface{}{
								"key":   "kalm-sso-granted-groups",
								"value": grantedGroups,
							},
						},
					},
					"authorizationResponse": map[string]interface{}{
						"allowedUpstreamHeaders": map[string]interface{}{
							"patterns": []interface{}{
								map[string]interface{}{
									"exact": "cookie",
								},
								map[string]interface{}{
									"exact": KALM_SSO_USERINFO_HEADER,
								},
							},
						},
					},
				},
			},
		}),
	}

	var matches []*v1alpha32.EnvoyFilter_EnvoyConfigObjectMatch

	baseMatch := &v1alpha32.EnvoyFilter_EnvoyConfigObjectMatch{
		Context: v1alpha32.EnvoyFilter_SIDECAR_INBOUND,
		ObjectTypes: &v1alpha32.EnvoyFilter_EnvoyConfigObjectMatch_Listener{
			Listener: &v1alpha32.EnvoyFilter_ListenerMatch{
				//Name: "virtualInbound",
				FilterChain: &v1alpha32.EnvoyFilter_ListenerMatch_FilterChainMatch{
					Filter: &v1alpha32.EnvoyFilter_ListenerMatch_FilterMatch{
						Name: "envoy.http_connection_manager",
						SubFilter: &v1alpha32.EnvoyFilter_ListenerMatch_SubFilterMatch{
							Name: "envoy.router",
						},
					},
				},
			},
		},
	}

	if len(r.endpoint.Spec.Ports) > 0 {
		for _, port := range r.endpoint.Spec.Ports {
			match := baseMatch.DeepCopy()
			match.ObjectTypes.(*v1alpha32.EnvoyFilter_EnvoyConfigObjectMatch_Listener).Listener.PortNumber = uint32(port)
			matches = append(matches, match)
		}
	} else {
		matches = append(matches, baseMatch.DeepCopy())
	}

	configPatches := make([]*v1alpha32.EnvoyFilter_EnvoyConfigObjectPatch, len(matches))

	for i := range matches {
		configPatches[i] = &v1alpha32.EnvoyFilter_EnvoyConfigObjectPatch{
			ApplyTo: v1alpha32.EnvoyFilter_HTTP_FILTER,
			Match:   matches[i],
			Patch:   patch,
		}
	}

	return &v1alpha3.EnvoyFilter{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
		},
		Spec: v1alpha32.EnvoyFilter{
			WorkloadSelector: &v1alpha32.WorkloadSelector{
				Labels: map[string]string{
					KalmLabelComponentKey: r.endpoint.Spec.EndpointName,
				},
			},
			ConfigPatches: configPatches,
		},
	}
}

func (r *ProtectedEndpointReconcilerTask) BuildAuthorizationPolicy(req ctrl.Request) *v1beta1.AuthorizationPolicy {
	name := fmt.Sprintf("kalm-sso-%s", req.Name)
	namespace := req.Namespace
	oidcProviderInfo := GetOIDCProviderInfo(r.ssoConfig)

	policy := &v1beta1.AuthorizationPolicy{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
		},
		Spec: v1beta12.AuthorizationPolicy{
			Selector: &v1beta13.WorkloadSelector{
				MatchLabels: map[string]string{
					KalmLabelComponentKey: r.endpoint.Spec.EndpointName,
				},
			},
			Action: v1beta12.AuthorizationPolicy_DENY,
			Rules: []*v1beta12.Rule{
				{

					When: []*v1beta12.Condition{
						{
							Key: "request.auth.claims[iss]",
							NotValues: []string{
								oidcProviderInfo.Issuer,
							},
						},
						// Check group here
					},
				},
			},
		},
	}

	if len(r.endpoint.Spec.Ports) > 0 {
		ports := make([]string, len(r.endpoint.Spec.Ports))

		for i := range r.endpoint.Spec.Ports {
			ports[i] = strconv.Itoa(int(r.endpoint.Spec.Ports[i]))
		}

		policy.Spec.Rules[0].To = []*v1beta12.Rule_To{
			{
				Operation: &v1beta12.Operation{
					Ports: ports,
				},
			},
		}
	}

	return policy
}

func (r *ProtectedEndpointReconcilerTask) BuildRequestAuthentication(req ctrl.Request) *v1beta1.RequestAuthentication {
	name := fmt.Sprintf("kalm-sso-%s", req.Name)
	namespace := req.Namespace
	oidcProviderInfo := GetOIDCProviderInfo(r.ssoConfig)
	requestAuthentication := &v1beta1.RequestAuthentication{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
		},
		Spec: v1beta12.RequestAuthentication{
			Selector: &v1beta13.WorkloadSelector{
				MatchLabels: map[string]string{
					KalmLabelComponentKey: r.endpoint.Spec.EndpointName,
				},
			},
			JwtRules: []*v1beta12.JWTRule{
				{
					Issuer: oidcProviderInfo.Issuer,
				},
			},
		},
	}

	return requestAuthentication
}

func (r *ProtectedEndpointReconcilerTask) ReconcileResources(req ctrl.Request) error {
	envoyFilter := r.BuildEnvoyFilter(req)

	if r.envoyFilter != nil {
		copied := r.envoyFilter.DeepCopy()
		copied.Spec = envoyFilter.Spec

		if err := ctrl.SetControllerReference(r.endpoint, copied, r.Scheme); err != nil {
			r.EmitWarningEvent(r.endpoint, err, "unable to set owner for envoyFilter")
			return err
		}

		if err := r.Patch(r.ctx, copied, client.MergeFrom(r.envoyFilter)); err != nil {
			r.Log.Error(err, "Patch envoyFilter failed.")
			return err
		}
	} else {
		if err := ctrl.SetControllerReference(r.endpoint, envoyFilter, r.Scheme); err != nil {
			r.EmitWarningEvent(r.endpoint, err, "unable to set owner for envoyFilter")
			return err
		}

		if err := r.Create(r.ctx, envoyFilter); err != nil {
			r.Log.Error(err, "Create envoyFilter failed.")
			return err
		}
	}

	// requestAuthentication policy can't satisfy our demands
	// Clean old resources created by old logic
	if r.requestAuthentication != nil {
		r.Delete(r.ctx, r.requestAuthentication)
	}

	// authorization policy can't satisfy our demands
	// Clean old resources created by old logic
	if r.authorizationPolicy != nil {
		r.Delete(r.ctx, r.authorizationPolicy)
	}

	return nil
}

func golangMapToProtoStruct(val map[string]interface{}) *protoTypes.Struct {
	fields := make(map[string]*protoTypes.Value)

	for k, v := range val {
		fields[k] = golangValueToProtoValue(v)
	}

	return &protoTypes.Struct{
		Fields: fields,
	}
}

func golangValueToProtoValue(val interface{}) *protoTypes.Value {
	switch typeVal := val.(type) {
	case bool:
		return &protoTypes.Value{
			Kind: &protoTypes.Value_BoolValue{
				BoolValue: typeVal,
			},
		}
	case string:
		return &protoTypes.Value{
			Kind: &protoTypes.Value_StringValue{
				StringValue: typeVal,
			},
		}
	case []interface{}:
		values := make([]*protoTypes.Value, len(typeVal))

		for i, v := range typeVal {
			values[i] = golangValueToProtoValue(v)
		}

		pbValue := &protoTypes.Value{
			Kind: &protoTypes.Value_ListValue{
				ListValue: &protoTypes.ListValue{
					Values: values,
				},
			},
		}
		return pbValue
	case map[string]interface{}:
		fields := make(map[string]*protoTypes.Value)

		for k, v := range typeVal {
			fields[k] = golangValueToProtoValue(v)
		}

		pbValue := &protoTypes.Value{
			Kind: &protoTypes.Value_StructValue{
				StructValue: &protoTypes.Struct{
					Fields: fields,
				},
			},
		}
		return pbValue
	case *protoTypes.Value:
		return typeVal
	default:
		panic(fmt.Errorf("Proto Value convertor error. No convertor for value %+v", val))
	}
}

// +kubebuilder:rbac:groups=core.kalm.dev,resources=protectedendpoints,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kalm.dev,resources=protectedendpoints/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=networking.istio.io,resources=envoyfilters,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=networking.istio.io,resources=envoyfilters/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=security.istio.io,resources=requestauthentications,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=security.istio.io,resources=requestauthentications/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=security.istio.io,resources=authorizationpolicies,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=security.istio.io,resources=authorizationpolicies/status,verbs=get;update;patch

func (r *ProtectedEndpointReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	task := &ProtectedEndpointReconcilerTask{
		ProtectedEndpointReconciler: r,
		ctx:                         context.Background(),
	}

	return ctrl.Result{}, task.Run(req)
}

type WatchAllSSOConfig struct {
	*BaseReconciler
}

func (r *WatchAllSSOConfig) Map(object handler.MapObject) []reconcile.Request {
	_, ok := object.Object.(*corev1alpha1.SingleSignOnConfig)

	if !ok {
		return nil
	}

	var endpointList corev1alpha1.ProtectedEndpointList

	if err := r.Reader.List(context.Background(), &endpointList); err != nil {
		r.Log.Error(err, "Get protected endpoints list failed.")
		return nil
	}

	var reqs []reconcile.Request

	for _, endpoint := range endpointList.Items {
		reqs = append(reqs, reconcile.Request{
			NamespacedName: types.NamespacedName{
				Name:      endpoint.Name,
				Namespace: endpoint.Namespace,
			},
		})

	}

	return reqs
}

func (r *ProtectedEndpointReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.ProtectedEndpoint{}).
		Owns(&v1alpha3.EnvoyFilter{}).
		Owns(&v1beta1.AuthorizationPolicy{}).
		Owns(&v1beta1.RequestAuthentication{}).
		Watches(
			&source.Kind{Type: &corev1alpha1.SingleSignOnConfig{}},
			&handler.EnqueueRequestsFromMapFunc{
				ToRequests: &WatchAllSSOConfig{r.BaseReconciler},
			},
		).
		Complete(r)
}

func NewProtectedEndpointReconciler(mgr ctrl.Manager) *ProtectedEndpointReconciler {
	return &ProtectedEndpointReconciler{NewBaseReconciler(mgr, "protectedendpoint")}
}
