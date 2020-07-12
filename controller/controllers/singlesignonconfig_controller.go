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
	corev1alpha1 "github.com/kapp-staging/kapp/controller/api/v1alpha1"
	"github.com/kapp-staging/kapp/controller/utils"
	"gopkg.in/yaml.v3"
	"istio.io/api/networking/v1alpha3"
	v1alpha32 "istio.io/client-go/pkg/apis/networking/v1alpha3"
	coreV1 "k8s.io/api/core/v1"
	rbacV1 "k8s.io/api/rbac/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

const KAPP_EXTERNAL_ENVOY_EXT_AUTHZ_SERVER_NAME = "external-envoy-ext-authz-server"
const KAPP_DEX_SECRET_NAME = "dex-secret"
const KAPP_DEX_NAMESPACE = "kapp-system"
const KAPP_DEX_NAME = "dex"

// SingleSignOnConfigReconciler reconciles a SingleSignOnConfig object
type SingleSignOnConfigReconciler struct {
	*BaseReconciler
}

type SingleSignOnConfigReconcilerTask struct {
	*SingleSignOnConfigReconciler
	ctx                   context.Context
	secret                *coreV1.Secret
	dexComponent          *corev1alpha1.Component
	route                 *corev1alpha1.HttpRoute
	externalEnvoyExtAuthz *v1alpha32.ServiceEntry
}

func (r *SingleSignOnConfigReconcilerTask) Run(req ctrl.Request) error {
	var ssoList corev1alpha1.SingleSignOnConfigList

	if err := r.Reader.List(r.ctx, &ssoList); err != nil {
		r.Log.Error(err, fmt.Sprintf("List sso error."))
		return err
	}

	if err := r.LoadResources(); err != nil {
		r.Log.Error(err, "Load resources error")
		return err
	}

	if len(ssoList.Items) == 0 {
		return r.DeleteResources()
	}

	if len(ssoList.Items) > 1 {
		r.Log.Error(
			fmt.Errorf("Only one SSO config is allowed."),
			"Found more than one SSO configs, Please keep single one and delete the others.",
		)
		return nil
	}

	ssoConfig := ssoList.Items[0]

	if ssoConfig.Spec.Issuer != "" {
		r.Log.Info(fmt.Sprintf("Using external OIDC provider %s.", ssoConfig.Spec.Issuer))
		return nil
	}

	return r.ReconcileResources(&ssoConfig)
}

func (r *SingleSignOnConfigReconcilerTask) LoadResources() error {
	var dexComponent corev1alpha1.Component

	err := r.Get(r.ctx, types.NamespacedName{
		Name:      KAPP_DEX_NAME,
		Namespace: KAPP_DEX_NAMESPACE,
	}, &dexComponent)

	if err != nil {
		if !errors.IsNotFound(err) {
			r.Log.Error(err, "get dex failed.")
			return err
		}
	} else {
		r.dexComponent = &dexComponent
	}

	var route corev1alpha1.HttpRoute

	err = r.Get(r.ctx, types.NamespacedName{
		Name:      KAPP_DEX_NAME,
		Namespace: KAPP_DEX_NAMESPACE,
	}, &route)

	if err != nil {
		if !errors.IsNotFound(err) {
			r.Log.Error(err, "get dex route failed.")
			return err
		}
	} else {
		r.route = &route
	}

	var externalEnvoyExtAuthz v1alpha32.ServiceEntry

	err = r.Get(r.ctx, types.NamespacedName{
		Name:      KAPP_EXTERNAL_ENVOY_EXT_AUTHZ_SERVER_NAME,
		Namespace: KAPP_DEX_NAMESPACE,
	}, &externalEnvoyExtAuthz)

	if err != nil {
		if !errors.IsNotFound(err) {
			r.Log.Error(err, "get externalEnvoyExtAuthz failed.")
			return err
		}
	} else {
		r.externalEnvoyExtAuthz = &externalEnvoyExtAuthz
	}

	var secret coreV1.Secret

	err = r.Get(r.ctx, types.NamespacedName{
		Name:      KAPP_DEX_SECRET_NAME,
		Namespace: KAPP_DEX_NAMESPACE,
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

	if r.route != nil {
		if err := r.Delete(r.ctx, r.route); err != nil {
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

func (r *SingleSignOnConfigReconcilerTask) BuildDexConfigYaml(ssoConfig *corev1alpha1.SingleSignOnConfig) (string, error) {
	oidcProviderInfo := GetOIDCProviderInfo(ssoConfig)

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
		"frontend": map[string]interface{}{
			"issuer": "kalm",
			"theme":  "tectonic",
		},
		"connectors": connectors,
		"oauth2": map[string]interface{}{
			"skipApprovalScreen": true,
		},
		"staticClients": []interface{}{
			map[string]interface{}{
				"id":     string(r.secret.Data["client_id"]),
				"name":   string(r.secret.Data["client_name"]),
				"secret": string(r.secret.Data["client_secret"]),
				"redirectURIs": []string{
					fmt.Sprintf("%s/oidc/callback", oidcProviderInfo.ExtAuthzServerUrl),
				},
			},
		},
	}

	configBytes, _ := yaml.Marshal(config)

	return string(configBytes), nil
}

func (r *SingleSignOnConfigReconcilerTask) ReconcileResources(ssoConfig *corev1alpha1.SingleSignOnConfig) error {
	if r.secret == nil {
		secret := coreV1.Secret{
			ObjectMeta: metaV1.ObjectMeta{
				Namespace: KAPP_DEX_NAMESPACE,
				Name:      KAPP_DEX_SECRET_NAME,
			},
			Data: map[string][]byte{
				"client_id":     []byte("kalm-sso"),
				"client_name":   []byte("Kalm SSO"),
				"client_secret": []byte(utils.RandString(64)),
			},
		}

		if err := ctrl.SetControllerReference(ssoConfig, &secret, r.Scheme); err != nil {
			r.EmitWarningEvent(ssoConfig, err, "unable to set owner for dex secret")
			return err
		}

		if err := r.Create(r.ctx, &secret); err != nil {
			r.Log.Error(err, "Create dex secret failed.")
			return err
		}

		r.secret = &secret
	}

	configFileContent, err := r.BuildDexConfigYaml(ssoConfig)

	if err != nil {
		r.Log.Error(err, "get dex config file error")
		return err
	}

	dexComponent := corev1alpha1.Component{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      KAPP_DEX_NAME,
			Namespace: KAPP_DEX_NAMESPACE,
		},
		Spec: corev1alpha1.ComponentSpec{
			WorkloadType: corev1alpha1.WorkloadTypeServer,
			Image:        "quay.io/dexidp/dex:v2.24.0",
			Command:      "/usr/local/bin/dex serve /etc/dex/cfg/config.yaml",
			Ports: []corev1alpha1.Port{
				{
					Name:          "http",
					ContainerPort: 5556,
					Protocol:      coreV1.ProtocolTCP,
				},
			},
			PreInjectedFiles: []corev1alpha1.PreInjectFile{
				{
					MountPath: "/etc/dex/cfg/config.yaml",
					Content:   configFileContent,
				},
			},
			RunnerPermission: &corev1alpha1.RunnerPermission{
				RoleType: "ClusterRole",
				Rules: []rbacV1.PolicyRule{
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

		if err := ctrl.SetControllerReference(ssoConfig, copied, r.Scheme); err != nil {
			r.EmitWarningEvent(ssoConfig, err, "unable to set owner for dex component")
			return err
		}

		if err := r.Patch(r.ctx, copied, client.MergeFrom(r.dexComponent)); err != nil {
			r.Log.Error(err, "Patch dex component failed.")
			return err
		}
	} else {
		if err := ctrl.SetControllerReference(ssoConfig, &dexComponent, r.Scheme); err != nil {
			r.EmitWarningEvent(ssoConfig, err, "unable to set owner for dex component")
			return err
		}

		if err := r.Create(r.ctx, &dexComponent); err != nil {
			r.Log.Error(err, "Create dex component failed.")
			return err
		}
	}

	timeout := 5

	var scheme string

	if ssoConfig.Spec.UseHttp {
		scheme = "http"
	} else {
		scheme = "https"
	}

	route := corev1alpha1.HttpRoute{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      KAPP_DEX_NAME,
			Namespace: KAPP_DEX_NAMESPACE,
		},
		Spec: corev1alpha1.HttpRouteSpec{
			Hosts: []string{
				ssoConfig.Spec.Domain,
			},
			Methods: []corev1alpha1.HttpRouteMethod{
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
			Paths:   []string{"/dex"},
			Schemes: []string{scheme},
			Destinations: []corev1alpha1.HttpRouteDestination{
				{
					Host:   fmt.Sprintf("%s.%s.svc.cluster.local:%d", KAPP_DEX_NAME, KAPP_DEX_NAMESPACE, 5556),
					Weight: 1,
				},
			},
			Timeout: &timeout,
			Retries: &corev1alpha1.HttpRouteRetries{
				Attempts:             3,
				PerTtyTimeoutSeconds: 2,
				RetryOn:              []string{"gateway-error", "connect-failure", "refused-stream"},
			},
		},
	}

	if r.route != nil {
		copied := r.route.DeepCopy()
		copied.Spec = route.Spec

		if err := ctrl.SetControllerReference(ssoConfig, copied, r.Scheme); err != nil {
			r.EmitWarningEvent(ssoConfig, err, "unable to set owner for dex route")
			return err
		}

		if err := r.Patch(r.ctx, copied, client.MergeFrom(r.route)); err != nil {
			r.Log.Error(err, "Patch dex route failed.")
			return err
		}
	} else {
		if err := ctrl.SetControllerReference(ssoConfig, &route, r.Scheme); err != nil {
			r.EmitWarningEvent(ssoConfig, err, "unable to set owner for dex route")
			return err
		}

		if err := r.Create(r.ctx, &route); err != nil {
			r.Log.Error(err, "Create dex route failed.")
			return err
		}
	}

	var externalEnvoyExtAuthzProtocol, externalEnvoyExtAuthzName string

	if ssoConfig.Spec.ExternalEnvoyExtAuthz.Scheme == "http" {
		externalEnvoyExtAuthzProtocol = "HTTP"
		externalEnvoyExtAuthzName = "http"
	} else {
		externalEnvoyExtAuthzName = "https"
		externalEnvoyExtAuthzProtocol = "HTTPS"
	}

	externalEnvoyExtAuthz := v1alpha32.ServiceEntry{
		ObjectMeta: metaV1.ObjectMeta{
			Namespace: KAPP_DEX_NAMESPACE,
			Name:      KAPP_EXTERNAL_ENVOY_EXT_AUTHZ_SERVER_NAME,
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

// +kubebuilder:rbac:groups=core.kapp.dev,resources=singlesignonconfigs,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=singlesignonconfigs/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=networking.istio.io,resources=serviceentries,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=networking.istio.io,resources=serviceentries/status,verbs=get;update;patch

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

func (r *SingleSignOnConfigReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		Owns(&coreV1.Secret{}).
		Owns(&corev1alpha1.Component{}).
		Owns(&corev1alpha1.HttpRoute{}).
		Owns(&v1alpha32.ServiceEntry{}).
		For(&corev1alpha1.SingleSignOnConfig{}).
		Complete(r)
}
