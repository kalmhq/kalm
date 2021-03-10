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
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/kalmhq/kalm/controller/utils"
	"gopkg.in/yaml.v3"
	"istio.io/api/networking/v1alpha3"
	v1alpha32 "istio.io/client-go/pkg/apis/networking/v1alpha3"
	corev1 "k8s.io/api/core/v1"

	rbacv1 "k8s.io/api/rbac/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

const KALM_EXTERNAL_ENVOY_EXT_AUTHZ_SERVER_NAME = "external-envoy-ext-authz-server"
const KALM_AUTH_PROXY_SECRET_NAME = "auth-proxy-secret"
const KALM_DEX_NAMESPACE = "kalm-system"
const KALM_DEX_NAME = "dex"
const KALM_AUTH_PROXY_NAME = "auth-proxy"

// SingleSignOnConfigReconciler reconciles a SingleSignOnConfig object
type SingleSignOnConfigReconciler struct {
	*BaseReconciler
}

type SingleSignOnConfigReconcilerTask struct {
	*SingleSignOnConfigReconciler
	ctx                   context.Context
	ssoConfig             *v1alpha1.SingleSignOnConfig
	secret                *corev1.Secret
	dexComponent          *v1alpha1.Component
	authProxyComponent    *v1alpha1.Component
	dexRoute              *v1alpha1.HttpRoute
	authProxyRoute        *v1alpha1.HttpRoute
	externalEnvoyExtAuthz *v1alpha32.ServiceEntry
}

func (r *SingleSignOnConfigReconcilerTask) Run(req ctrl.Request) error {
	var ssoList v1alpha1.SingleSignOnConfigList

	if err := r.Reader.List(r.ctx, &ssoList); err != nil {
		r.Log.Error(err, "List sso error.")
		return err
	}

	if len(ssoList.Items) == 0 {
		return r.DeleteResources()
	}

	if len(ssoList.Items) > 1 {
		r.Log.Error(nil, "Only one SSO config is allowed. Found more than one SSO configs, Please keep single one and delete the others.")
		return nil
	}

	ssoConfig := ssoList.Items[0]

	r.ssoConfig = &ssoConfig

	if err := r.LoadResources(); err != nil {
		r.Log.Error(err, "Load resources error")
		return err
	}

	return r.ReconcileResources()
}

func (r *SingleSignOnConfigReconcilerTask) LoadResources() error {
	var dexComponent v1alpha1.Component

	err := r.Get(r.ctx, types.NamespacedName{
		Name:      KALM_DEX_NAME,
		Namespace: KALM_DEX_NAMESPACE,
	}, &dexComponent)

	if err != nil {
		if !errors.IsNotFound(err) {
			r.Log.Error(err, "get dexComponent failed.")
			return err
		}
	} else {
		r.dexComponent = &dexComponent
	}

	var authProxyComponent v1alpha1.Component

	err = r.Get(r.ctx, types.NamespacedName{
		Name:      KALM_AUTH_PROXY_NAME,
		Namespace: KALM_DEX_NAMESPACE,
	}, &authProxyComponent)

	if err != nil {
		if !errors.IsNotFound(err) {
			r.Log.Error(err, "get authProxyComponent failed.")
			return err
		}
	} else {
		r.authProxyComponent = &authProxyComponent
	}

	var route v1alpha1.HttpRoute

	err = r.Get(r.ctx, types.NamespacedName{
		Name: KALM_DEX_NAME,
	}, &route)

	if err != nil {
		if !errors.IsNotFound(err) {
			r.Log.Error(err, "get dex route failed.")
			return err
		}
	} else {
		r.dexRoute = &route
	}

	var authProxyRoute v1alpha1.HttpRoute

	err = r.Get(r.ctx, types.NamespacedName{
		Name: KALM_AUTH_PROXY_NAME,
	}, &authProxyRoute)

	if err != nil {
		if !errors.IsNotFound(err) {
			r.Log.Error(err, "get authProxyRoute failed.")
			return err
		}
	} else {
		r.authProxyRoute = &authProxyRoute
	}

	var externalEnvoyExtAuthz v1alpha32.ServiceEntry

	err = r.Get(r.ctx, types.NamespacedName{
		Name:      KALM_EXTERNAL_ENVOY_EXT_AUTHZ_SERVER_NAME,
		Namespace: KALM_DEX_NAMESPACE,
	}, &externalEnvoyExtAuthz)

	if err != nil {
		if !errors.IsNotFound(err) {
			r.Log.Error(err, "get externalEnvoyExtAuthz failed.")
			return err
		}
	} else {
		r.externalEnvoyExtAuthz = &externalEnvoyExtAuthz
	}

	var secret corev1.Secret

	err = r.Get(r.ctx, types.NamespacedName{
		Name:      KALM_AUTH_PROXY_SECRET_NAME,
		Namespace: KALM_DEX_NAMESPACE,
	}, &secret)

	if err != nil {
		if !errors.IsNotFound(err) {
			r.Log.Error(err, "get secret failed.")
			return err
		}
	} else {
		r.secret = &secret
	}

	return nil
}

func (r *SingleSignOnConfigReconcilerTask) DeleteResources() error {
	if r.secret != nil {
		if err := r.Delete(r.ctx, r.secret); err != nil {
			r.Log.Error(err, "delete dex secret error")
			return err
		}
	}

	if r.dexComponent != nil {
		if err := r.Delete(r.ctx, r.dexComponent); err != nil {
			r.Log.Error(err, "delete dex component error")
			return err
		}
	}

	if r.dexRoute != nil {
		if err := r.Delete(r.ctx, r.dexRoute); err != nil {
			r.Log.Error(err, "delete dex route error")
			return err
		}
	}

	if r.externalEnvoyExtAuthz != nil {
		if err := r.Delete(r.ctx, r.externalEnvoyExtAuthz); err != nil {
			r.Log.Error(err, "delete externalEnvoyExtAuthz error")
			return err
		}
	}

	return nil
}

func (r *SingleSignOnConfigReconcilerTask) BuildDexConfigYaml(ssoConfig *v1alpha1.SingleSignOnConfig) (string, error) {
	oidcProviderInfo := GetOIDCProviderInfo(ssoConfig)

	var expirySeconds uint32

	if ssoConfig.Spec.IDTokenExpirySeconds != nil {
		expirySeconds = *ssoConfig.Spec.IDTokenExpirySeconds
	} else {
		expirySeconds = v1alpha1.SSODefaultIDTokenExpirySeconds
	}

	config := map[string]interface{}{
		"issuer": oidcProviderInfo.Issuer,
		"storage": map[string]interface{}{
			"type": "kubernetes",
			"config": map[string]interface{}{
				"inCluster": true,
			},
		},
		"web": map[string]interface{}{
			"http": "0.0.0.0:5556",
		},
		"expiry": map[string]interface{}{
			"idTokens": fmt.Sprintf("%ds", expirySeconds),
		},
		"frontend": map[string]interface{}{
			"issuer": "kalm",
			"theme":  "tectonic",
		},
		"oauth2": map[string]interface{}{
			"skipApprovalScreen": true,
		},
		"staticClients": []interface{}{
			map[string]interface{}{
				"id":     string(r.secret.Data["client_id"]),
				"name":   string(r.secret.Data["client_name"]),
				"secret": string(r.secret.Data["client_secret"]),
				"redirectURIs": []string{
					fmt.Sprintf("%s/oidc/callback", oidcProviderInfo.AuthProxyExternalUrl),
				},
			},
		},
	}

	if len(ssoConfig.Spec.Connectors) > 0 {
		var connectors []interface{}

		for _, connector := range ssoConfig.Spec.Connectors {
			rawConnector := map[string]interface{}{
				"id":   connector.ID,
				"type": connector.Type,
				"name": connector.Name,
			}

			if connector.Config != nil {
				var config map[string]interface{}
				err := json.Unmarshal(connector.Config.Raw, &config)

				if err != nil {
					r.Log.Error(err, "Unmarshal connector config failed")
					return "", err
				}

				config["redirectURI"] = oidcProviderInfo.Issuer + "/callback"

				rawConnector["config"] = config
			}

			connectors = append(connectors, rawConnector)
		}

		config["connectors"] = connectors
	}

	if ssoConfig.Spec.TemporaryUser != nil {
		config["enablePasswordDB"] = true
		config["staticPasswords"] = []interface{}{
			map[string]interface{}{
				"email":    ssoConfig.Spec.TemporaryUser.Email,
				"hash":     ssoConfig.Spec.TemporaryUser.PasswordHash,
				"username": ssoConfig.Spec.TemporaryUser.Username,
				"userID":   ssoConfig.Spec.TemporaryUser.UserID,
			},
		}
	}

	configBytes, _ := yaml.Marshal(config)

	return string(configBytes), nil
}

func (r *SingleSignOnConfigReconcilerTask) ReconcileSecret() error {
	if r.secret == nil {
		secret := corev1.Secret{
			ObjectMeta: metav1.ObjectMeta{
				Namespace: KALM_DEX_NAMESPACE,
				Name:      KALM_AUTH_PROXY_SECRET_NAME,
			},
			Data: map[string][]byte{
				"client_id":     []byte("kalm-sso"),
				"client_name":   []byte("Kalm SSO"),
				"client_secret": []byte(utils.RandString(64)),
			},
		}

		// in BYOC mode, clientId & secret should be generated from Kalm-Cloud
		if r.ssoConfig.Spec.Issuer != "" &&
			r.ssoConfig.Spec.IssuerClientId != "" &&
			r.ssoConfig.Spec.IssuerClientSecret != "" {

			secret.Data["client_id"] = []byte(r.ssoConfig.Spec.IssuerClientId)
			secret.Data["client_secret"] = []byte(r.ssoConfig.Spec.IssuerClientSecret)
		}

		if err := ctrl.SetControllerReference(r.ssoConfig, &secret, r.Scheme); err != nil {
			r.EmitWarningEvent(r.ssoConfig, err, "unable to set owner for auth-proxy secret")
			return err
		}

		if err := r.Create(r.ctx, &secret); err != nil {
			r.Log.Error(err, "create auth-proxy secret failed.")
			return err
		}

		r.secret = &secret
	} else {
		if r.ssoConfig.Spec.Issuer != "" &&
			r.ssoConfig.Spec.IssuerClientId != "" &&
			r.ssoConfig.Spec.IssuerClientSecret != "" {

			r.secret.Data["client_id"] = []byte(r.ssoConfig.Spec.IssuerClientId)
			r.secret.Data["client_secret"] = []byte(r.ssoConfig.Spec.IssuerClientSecret)

			if err := r.Update(r.ctx, r.secret); err != nil {
				r.Log.Error(err, "update auth-proxy secret failed.")
				return err
			}
		}
	}

	return nil
}

func (r *SingleSignOnConfigReconcilerTask) ReconcileDexComponent() error {
	configFileContent, err := r.BuildDexConfigYaml(r.ssoConfig)

	if err != nil {
		r.Log.Error(err, "get dex config file error")
		return err
	}

	dexComponent := v1alpha1.Component{
		ObjectMeta: metav1.ObjectMeta{
			Name:      KALM_DEX_NAME,
			Namespace: KALM_DEX_NAMESPACE,
		},
		Spec: v1alpha1.ComponentSpec{
			Annotations: map[string]string{
				"sidecar.istio.io/inject": "false",
			},
			WorkloadType: v1alpha1.WorkloadTypeServer,
			Image:        "quay.io/dexidp/dex:v2.24.0",
			Command:      "/usr/local/bin/dex serve /etc/dex/cfg/config.yaml",
			Ports: []v1alpha1.Port{
				{
					ContainerPort: 5556,
					Protocol:      v1alpha1.PortProtocolHTTP,
				},
			},
			PreInjectedFiles: []v1alpha1.PreInjectFile{
				{
					MountPath: "/etc/dex/cfg/config.yaml",
					Content:   configFileContent,
				},
			},
			RunnerPermission: &v1alpha1.RunnerPermission{
				RoleType: "clusterRole",
				Rules: []rbacv1.PolicyRule{
					{
						APIGroups: []string{"dex.coreos.com"},
						Resources: []string{"*"},
						Verbs:     []string{"*"},
					},
					{
						APIGroups: []string{"apiextensions.k8s.io"},
						Resources: []string{"customresourcedefinitions"},
						Verbs:     []string{"create"},
					},
				},
			},
		},
	}

	if r.dexComponent != nil {
		copied := r.dexComponent.DeepCopy()
		copied.Spec = dexComponent.Spec

		if err := ctrl.SetControllerReference(r.ssoConfig, copied, r.Scheme); err != nil {
			r.EmitWarningEvent(r.ssoConfig, err, "unable to set owner for dex component")
			return err
		}

		if err := r.Patch(r.ctx, copied, client.MergeFrom(r.dexComponent)); err != nil {
			r.Log.Error(err, "Patch dex component failed.")
			return err
		}
	} else {
		if err := ctrl.SetControllerReference(r.ssoConfig, &dexComponent, r.Scheme); err != nil {
			r.EmitWarningEvent(r.ssoConfig, err, "unable to set owner for dex component")
			return err
		}

		if err := r.Create(r.ctx, &dexComponent); err != nil {
			r.Log.Error(err, "Create dex component failed.")
			return err
		}
	}

	return nil
}

func (r *SingleSignOnConfigReconcilerTask) ReconcileDexRoute() error {
	dexRoute := v1alpha1.HttpRoute{
		ObjectMeta: metav1.ObjectMeta{
			Name: KALM_DEX_NAME,
		},
		Spec: v1alpha1.HttpRouteSpec{
			Hosts: []string{
				r.ssoConfig.Spec.Domain,
			},
			Methods: []v1alpha1.HttpRouteMethod{
				"GET",
				"POST",
				"PUT",
				"PATCH",
				"DELETE",
				"HEAD",
				"OPTIONS",
				"CONNECT",
				"TRACE",
			},
			Paths: []string{"/dex"},
			Schemes: []v1alpha1.HttpRouteScheme{
				v1alpha1.HttpRouteScheme("http"),
				v1alpha1.HttpRouteScheme("https"),
			},
			HttpRedirectToHttps: !r.ssoConfig.Spec.UseHttp,
			Destinations: []v1alpha1.HttpRouteDestination{
				{
					Host:   fmt.Sprintf("%s.%s.svc.cluster.local:%d", KALM_DEX_NAME, KALM_DEX_NAMESPACE, 5556),
					Weight: 1,
				},
			},
		},
	}

	if r.dexRoute != nil {
		copied := r.dexRoute.DeepCopy()
		copied.Spec = dexRoute.Spec

		// if err := ctrl.SetControllerReference(r.ssoConfig, copied, r.Scheme); err != nil {
		// 	r.EmitWarningEvent(r.ssoConfig, err, "unable to set owner for dex dexRoute")
		// 	return err
		// }

		if err := r.Patch(r.ctx, copied, client.MergeFrom(r.dexRoute)); err != nil {
			r.Log.Error(err, "Patch dex dexRoute failed.")
			return err
		}
	} else {
		// if err := ctrl.SetControllerReference(r.ssoConfig, &dexRoute, r.Scheme); err != nil {
		// 	r.EmitWarningEvent(r.ssoConfig, err, "unable to set owner for dex dexRoute")
		// 	return err
		// }

		if err := r.Create(r.ctx, &dexRoute); err != nil {
			r.Log.Error(err, "Create dex dexRoute failed.")
			return err
		}
	}

	return nil
}

func (r *SingleSignOnConfigReconcilerTask) ReconcileExternalAuthProxyServiceEntry(ssoConfig *v1alpha1.SingleSignOnConfig) error {
	var externalEnvoyExtAuthzProtocol, externalEnvoyExtAuthzName string

	if ssoConfig.Spec.ExternalEnvoyExtAuthz.Scheme == "http" {
		externalEnvoyExtAuthzProtocol = "HTTP"
		externalEnvoyExtAuthzName = "http"
	} else {
		externalEnvoyExtAuthzName = "https"
		externalEnvoyExtAuthzProtocol = "HTTPS"
	}

	externalEnvoyExtAuthz := v1alpha32.ServiceEntry{
		ObjectMeta: metav1.ObjectMeta{
			Namespace: KALM_DEX_NAMESPACE,
			Name:      KALM_EXTERNAL_ENVOY_EXT_AUTHZ_SERVER_NAME,
		},
		Spec: v1alpha3.ServiceEntry{
			Hosts: []string{ssoConfig.Spec.ExternalEnvoyExtAuthz.Host},
			Ports: []*v1alpha3.Port{
				{
					Number:   uint32(ssoConfig.Spec.ExternalEnvoyExtAuthz.Port),
					Name:     externalEnvoyExtAuthzName,
					Protocol: externalEnvoyExtAuthzProtocol,
				},
			},
			Location:   v1alpha3.ServiceEntry_MESH_EXTERNAL,
			Resolution: v1alpha3.ServiceEntry_DNS,
		},
	}

	if r.externalEnvoyExtAuthz != nil {
		copied := r.externalEnvoyExtAuthz.DeepCopy()
		copied.Spec = externalEnvoyExtAuthz.Spec

		if err := ctrl.SetControllerReference(ssoConfig, copied, r.Scheme); err != nil {
			r.EmitWarningEvent(ssoConfig, err, "unable to set owner for externalEnvoyExtAuthz")
			return err
		}

		if err := r.Patch(r.ctx, copied, client.MergeFrom(r.externalEnvoyExtAuthz)); err != nil {
			r.Log.Error(err, "Patch externalEnvoyExtAuthz failed.")
			return err
		}
	} else {
		if err := ctrl.SetControllerReference(ssoConfig, &externalEnvoyExtAuthz, r.Scheme); err != nil {
			r.EmitWarningEvent(ssoConfig, err, "unable to set owner for externalEnvoyExtAuthz")
			return err
		}

		if err := r.Create(r.ctx, &externalEnvoyExtAuthz); err != nil {
			r.Log.Error(err, "Create externalEnvoyExtAuthz failed.")
			return err
		}
	}
	return nil
}

func getKalmVersionFromEnv() string {
	return os.Getenv("KALM_VERSION")
}
func getKalmAuthProxyVersionFromEnv() string {
	return os.Getenv("KALM_AUTH_PROXY_VERSION")
}

const DefaultAuthProxyImgTag = "latest"

func (r *SingleSignOnConfigReconcilerTask) ReconcileInternalAuthProxyComponent() error {
	clientID := string(r.secret.Data["client_id"])
	clientSecret := string(r.secret.Data["client_secret"])
	oidcProviderInfo := GetOIDCProviderInfo(r.ssoConfig)

	kalmAuthProxyVersion := getKalmAuthProxyVersionFromEnv()
	kalmVersion := getKalmVersionFromEnv()

	var authProxyImgTag string
	if kalmAuthProxyVersion != "" {
		authProxyImgTag = kalmAuthProxyVersion
	} else if kalmVersion != "" {
		authProxyImgTag = kalmVersion
	} else {
		authProxyImgTag = DefaultAuthProxyImgTag
	}

	authProxyComponent := v1alpha1.Component{
		ObjectMeta: metav1.ObjectMeta{
			Name:      KALM_AUTH_PROXY_NAME,
			Namespace: KALM_DEX_NAMESPACE,
		},
		Spec: v1alpha1.ComponentSpec{
			WorkloadType: v1alpha1.WorkloadTypeServer,
			Image:        fmt.Sprintf("kalmhq/kalm:%s", authProxyImgTag),
			Command:      "./auth-proxy",
			Ports: []v1alpha1.Port{
				{
					ContainerPort: 3002,
					ServicePort:   80,
					Protocol:      v1alpha1.PortProtocolHTTP2,
				},
			},
			Env: []v1alpha1.EnvVar{
				{
					Type:  v1alpha1.EnvVarTypeStatic,
					Name:  "KALM_OIDC_CLIENT_ID",
					Value: clientID,
				},
				{
					Type:  v1alpha1.EnvVarTypeStatic,
					Name:  "KALM_OIDC_CLIENT_SECRET",
					Value: clientSecret,
				},
				{
					Type:  v1alpha1.EnvVarTypeStatic,
					Name:  "KALM_OIDC_PROVIDER_URL",
					Value: oidcProviderInfo.Issuer,
				},
				{
					Type:  v1alpha1.EnvVarTypeStatic,
					Name:  "KALM_OIDC_AUTH_PROXY_URL",
					Value: oidcProviderInfo.AuthProxyExternalUrl,
				},
				{
					Type:  v1alpha1.EnvVarTypeStatic,
					Name:  v1alpha1.ENV_KALM_PHYSICAL_CLUSTER_ID,
					Value: v1alpha1.GetEnvPhysicalClusterID(),
				},
				{
					Type:  v1alpha1.EnvVarTypeStatic,
					Name:  v1alpha1.ENV_NEED_EXTRA_OAUTH_SCOPE,
					Value: strconv.FormatBool(r.ssoConfig.Spec.NeedExtraOAuthScope),
				},
			},
			ResourceRequirements: &corev1.ResourceRequirements{
				Requests: map[corev1.ResourceName]resource.Quantity{
					corev1.ResourceCPU:    resource.MustParse("10m"),
					corev1.ResourceMemory: resource.MustParse("10Mi"),
				},
			},
		},
	}

	if r.authProxyComponent != nil {
		copied := r.authProxyComponent.DeepCopy()
		copied.Spec = authProxyComponent.Spec

		if err := ctrl.SetControllerReference(r.ssoConfig, copied, r.Scheme); err != nil {
			r.EmitWarningEvent(r.ssoConfig, err, "unable to set owner for authProxyComponent")
			return err
		}

		if err := r.Patch(r.ctx, copied, client.MergeFrom(r.authProxyComponent)); err != nil {
			r.Log.Error(err, "Patch authProxyComponent failed.")
			return err
		}
	} else {
		if err := ctrl.SetControllerReference(r.ssoConfig, &authProxyComponent, r.Scheme); err != nil {
			r.EmitWarningEvent(r.ssoConfig, err, "unable to set owner for authProxyComponent")
			return err
		}

		if err := r.Create(r.ctx, &authProxyComponent); err != nil {
			r.Log.Error(err, "Create authProxyComponent failed.")
			return err
		}
	}

	return nil
}

func (r *SingleSignOnConfigReconcilerTask) ReconcileInternalAuthProxyRoute() error {
	authProxyRoute := v1alpha1.HttpRoute{
		ObjectMeta: metav1.ObjectMeta{
			Name: KALM_AUTH_PROXY_NAME,
		},
		Spec: v1alpha1.HttpRouteSpec{
			Hosts: []string{
				r.ssoConfig.Spec.Domain,
			},
			Methods: []v1alpha1.HttpRouteMethod{
				"GET",
			},
			Paths: []string{"/oidc/login", "/oidc/callback"},
			Schemes: []v1alpha1.HttpRouteScheme{
				v1alpha1.HttpRouteScheme("http"),
				v1alpha1.HttpRouteScheme("https"),
			},
			HttpRedirectToHttps: !r.ssoConfig.Spec.UseHttp,
			Destinations: []v1alpha1.HttpRouteDestination{
				{
					Host:   fmt.Sprintf("%s.%s.svc.cluster.local", KALM_AUTH_PROXY_NAME, KALM_DEX_NAMESPACE),
					Weight: 1,
				},
			},
		},
	}

	if r.authProxyRoute != nil {
		copied := r.authProxyRoute.DeepCopy()
		copied.Spec = authProxyRoute.Spec

		// if err := ctrl.SetControllerReference(r.ssoConfig, copied, r.Scheme); err != nil {
		// 	r.EmitWarningEvent(r.ssoConfig, err, "unable to set owner for authProxyRoute")
		// 	return err
		// }

		if err := r.Patch(r.ctx, copied, client.MergeFrom(r.authProxyRoute)); err != nil {
			r.Log.Error(err, "Patch authProxyRoute failed.")
			return err
		}
	} else {
		// if err := ctrl.SetControllerReference(r.ssoConfig, &authProxyRoute, r.Scheme); err != nil {
		// 	r.EmitWarningEvent(r.ssoConfig, err, "unable to set owner for authProxyRoute")
		// 	return err
		// }

		if err := r.Create(r.ctx, &authProxyRoute); err != nil {
			r.Log.Error(err, "Create authProxyRoute failed.")
			return err
		}
	}

	return nil
}

func (r *SingleSignOnConfigReconcilerTask) ReconcileAuthProxy() error {
	if r.ssoConfig.Spec.ExternalEnvoyExtAuthz != nil {
		if r.authProxyComponent != nil {
			if err := r.Delete(r.ctx, r.authProxyComponent); err != nil {
				r.Log.Error(err, "Delete authProxyComponent failed.")
				return err
			}
		}

		if r.authProxyRoute != nil {
			if err := r.Delete(r.ctx, r.authProxyRoute); err != nil {
				r.Log.Error(err, "Delete authProxyRoute failed.")
				return err
			}
		}

		return r.ReconcileExternalAuthProxyServiceEntry(r.ssoConfig)
	}

	if r.externalEnvoyExtAuthz != nil {
		if err := r.Delete(r.ctx, r.externalEnvoyExtAuthz); err != nil {
			r.Log.Error(err, "Delete externalEnvoyExtAuthz failed.")
			return err
		}
	}

	if err := r.ReconcileInternalAuthProxyComponent(); err != nil {
		r.Log.Error(err, "reconcile internal auth proxy failed.")
		return err
	}

	if err := r.ReconcileInternalAuthProxyRoute(); err != nil {
		r.Log.Error(err, "reconcile internal auth proxy route failed.")
		return err
	}

	return nil
}

func (r *SingleSignOnConfigReconcilerTask) ReconcileDexRouteCert() error {
	if r.ssoConfig.Spec.UseHttp {
		return nil
	}

	if r.ssoConfig.Spec.Domain == "" {
		return nil
	}

	certName := "sso-domain-" + strings.ReplaceAll(strings.ToLower(r.ssoConfig.Spec.Domain), ".", "-")

	var cert v1alpha1.HttpsCert

	if err := r.Reader.Get(r.ctx, types.NamespacedName{
		Name:      certName,
		Namespace: KALM_DEX_NAMESPACE,
	}, &cert); err != nil {
		if errors.IsNotFound(err) {
			res := v1alpha1.HttpsCert{
				ObjectMeta: metav1.ObjectMeta{
					Name:      certName,
					Namespace: KALM_DEX_NAMESPACE,
				},
				Spec: v1alpha1.HttpsCertSpec{
					HttpsCertIssuer: v1alpha1.DefaultHTTP01IssuerName,
					Domains:         []string{r.ssoConfig.Spec.Domain},
				},
			}

			if err := r.Create(r.ctx, &res); err != nil {
				r.Log.Error(err, "Create cert failed.")
				return err
			}
		} else {
			r.Log.Error(err, fmt.Sprintf("Get sso domain cert error, certName: %s", certName))
			return err
		}
	}

	return nil
}

func (r *SingleSignOnConfigReconcilerTask) ReconcileResources() error {
	if err := r.ReconcileSecret(); err != nil {
		return err
	}

	if err := r.ReconcileAuthProxy(); err != nil {
		return err
	}

	// use dex mode
	if r.ssoConfig.Spec.Issuer == "" {
		if err := r.ReconcileDexComponent(); err != nil {
			return err
		}

		if err := r.ReconcileDexRoute(); err != nil {
			return err
		}

		if err := r.ReconcileDexRouteCert(); err != nil {
			return err
		}
	}

	return nil
}

// +kubebuilder:rbac:groups=core.kalm.dev,resources=singlesignonconfigs,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kalm.dev,resources=singlesignonconfigs/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=networking.istio.io,resources=serviceentries,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=networking.istio.io,resources=serviceentries/status,verbs=get;update;patch

// +kubebuilder:rbac:groups="",resources=serviceaccounts,verbs=*
// +kubebuilder:rbac:groups=rbac.authorization.k8s.io,resources=clusterroles;clusterrolebindings,verbs=*
// +kubebuilder:rbac:groups=apiextensions.k8s.io,resources=customresourcedefinitions,verbs=create
// +kubebuilder:rbac:groups=dex.coreos.com,resources=*,verbs=create

func (r *SingleSignOnConfigReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	task := &SingleSignOnConfigReconcilerTask{
		SingleSignOnConfigReconciler: r,
		ctx:                          context.Background(),
	}

	return ctrl.Result{}, task.Run(req)
}

func NewSingleSignOnConfigReconciler(mgr ctrl.Manager) *SingleSignOnConfigReconciler {
	return &SingleSignOnConfigReconciler{NewBaseReconciler(mgr, "SingleSignOnConfig")}
}

// type SSORequestMapper struct {
// 	*BaseReconciler
// }

// func (r *SSORequestMapper) Map(object handler.MapObject) []reconcile.Request {
// 	if route, ok := object.Object.(*v1alpha1.HttpRoute); ok {
// 		tenantName, err := v1alpha1.GetTenantNameFromObj(route)

// 		if err != nil || tenantName != "global" {
// 			return nil
// 		}
// 	} else {
// 		return nil
// 	}

// 	var ssoList v1alpha1.SingleSignOnConfigList

// 	if err := r.Reader.List(context.Background(), &ssoList); err != nil {
// 		r.Log.Error(err, fmt.Sprintf("List sso error in mapper."))
// 		return nil
// 	}

// 	res := make([]reconcile.Request, len(ssoList.Items))

// 	for i := range ssoList.Items {
// 		res[i] = reconcile.Request{NamespacedName: types.NamespacedName{Name: ssoList.Items[i].Name}}
// 	}

// 	return res
// }

func (r *SingleSignOnConfigReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		Owns(&corev1.Secret{}).
		Owns(&v1alpha1.Component{}).
		Owns(&v1alpha1.HttpRoute{}).
		Owns(&v1alpha32.ServiceEntry{}).
		For(&v1alpha1.SingleSignOnConfig{}).
		// Watches(
		// 	&source.Kind{Type: &v1alpha1.HttpRoute{}},
		// 	&handler.EnqueueRequestsFromMapFunc{
		// 		ToRequests: &SSORequestMapper{r.BaseReconciler},
		// 	},
		// ).
		Complete(r)
}
