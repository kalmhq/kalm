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
	istioNetworkingV1Beta1 "istio.io/api/networking/v1beta1"
	"istio.io/client-go/pkg/apis/networking/v1beta1"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
	"sigs.k8s.io/controller-runtime/pkg/source"

	corev1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
	ctrl "sigs.k8s.io/controller-runtime"
)

const (
	KAPP_GATEWAY_NAMESPACE = "istio-system"
	KAPP_GATEWAY_NAME      = "kalm-gateway"

	HTTPS_GATEWAY_NAME = "kalm-https-gateway"
	HTTP_GATEWAY_NAME  = "kalm-http-gateway"
)

var (
	HTTPS_GATEWAY_NAMESPACED_NAME = types.NamespacedName{Namespace: KAPP_GATEWAY_NAMESPACE, Name: HTTPS_GATEWAY_NAME}
	HTTP_GATEWAY_NAMESPACED_NAME  = types.NamespacedName{Namespace: KAPP_GATEWAY_NAMESPACE, Name: HTTP_GATEWAY_NAME}
)

type GatewayReconcilerTask struct {
	*GatewayReconciler
	ctx   context.Context
	certs []*corev1alpha1.HttpsCert
}

func (r *GatewayReconcilerTask) ReconcileNamespace() error {
	var ns coreV1.Namespace
	if err := r.Reader.Get(r.ctx, types.NamespacedName{Name: KAPP_GATEWAY_NAMESPACE}, &ns); err != nil {
		if !errors.IsNotFound(err) {
			return err
		}

		ns.Name = KAPP_GATEWAY_NAMESPACE
		if err := r.Create(r.ctx, &ns); err != nil {
			return err
		}
	}
	return nil
}

func (r *GatewayReconcilerTask) HttpsGateway() error {
	isCreate := false

	gw := &v1beta1.Gateway{}
	if err := r.Reader.Get(r.ctx, HTTPS_GATEWAY_NAMESPACED_NAME, gw); err != nil {
		if !errors.IsNotFound(err) {
			return err
		}

		isCreate = true
	}

	gw.Name = HTTPS_GATEWAY_NAMESPACED_NAME.Name
	gw.Namespace = HTTPS_GATEWAY_NAMESPACED_NAME.Namespace

	var certs corev1alpha1.HttpsCertList
	if err := r.Reader.List(context.Background(), &certs); err != nil {
		return err
	}

	if len(certs.Items) == 0 {
		if !isCreate {
			return r.Delete(r.ctx, gw)
		}

		return nil
	}

	if gw.Spec.Selector == nil {
		gw.Spec.Selector = make(map[string]string)
	}

	gw.Spec.Selector["istio"] = "ingressgateway"
	gw.Spec.Servers = []*istioNetworkingV1Beta1.Server{}

	for _, cert := range certs.Items {
		_, secretName := getCertAndCertSecretName(cert)
		server := &istioNetworkingV1Beta1.Server{
			Hosts: cert.Spec.Domains,
			Port: &istioNetworkingV1Beta1.Port{
				Number:   443,
				Protocol: "HTTPS",
				Name:     fmt.Sprintf("https-%s", secretName),
			},
			Tls: &istioNetworkingV1Beta1.Server_TLSOptions{
				Mode:           istioNetworkingV1Beta1.Server_TLSOptions_SIMPLE,
				CredentialName: secretName,
			},
		}

		gw.Spec.Servers = append(gw.Spec.Servers, server)
	}

	return r.updateGateway(isCreate, gw)
}

func (r *GatewayReconcilerTask) HttpGateway() error {
	isCreate := false

	gw := &v1beta1.Gateway{}
	if err := r.Reader.Get(r.ctx, HTTP_GATEWAY_NAMESPACED_NAME, gw); err != nil {
		if !errors.IsNotFound(err) {
			return err
		}

		isCreate = true
	}

	gw.Name = HTTP_GATEWAY_NAMESPACED_NAME.Name
	gw.Namespace = HTTP_GATEWAY_NAMESPACED_NAME.Namespace

	if gw.Spec.Selector == nil {
		gw.Spec.Selector = make(map[string]string)
	}

	gw.Spec.Selector["istio"] = "ingressgateway"
	gw.Spec.Servers = []*istioNetworkingV1Beta1.Server{
		{
			Hosts: []string{"*"},
			Port: &istioNetworkingV1Beta1.Port{
				Number:   80,
				Protocol: "http",
				Name:     "kalm-http",
			},
		},
	}

	return r.updateGateway(isCreate, gw)
}

func (r *GatewayReconcilerTask) updateGateway(isCreate bool, gw *v1beta1.Gateway) error {
	if isCreate {
		if err := r.Create(r.ctx, gw); err != nil {
			r.Log.Error(err, fmt.Sprintf("Create gateway %s error.", gw.Name))
			return err
		}
	} else {
		if len(gw.Spec.Servers) == 0 {
			if err := r.Delete(r.ctx, gw); err != nil {
				r.Log.Error(err, fmt.Sprintf("Delete gateway %s error.", gw.Name))
				return err
			}
		} else {
			if err := r.Update(r.ctx, gw); err != nil {
				r.Log.Error(err, fmt.Sprintf("Update gateway %s error.", gw.Name))
				return err
			}
		}
	}

	return nil
}

func (r *GatewayReconcilerTask) Run(req ctrl.Request) error {
	if err := r.ReconcileNamespace(); err != nil {
		return err
	}

	if err := r.HttpsGateway(); err != nil {
		return err
	}

	if err := r.HttpGateway(); err != nil {
		return err
	}

	return nil
}

// GatewayReconciler reconciles a HttpRoute object
type GatewayReconciler struct {
	*BaseReconciler
}

// +kubebuilder:rbac:groups=networking.istio.io,resources=gateways,verbs=*

func (r *GatewayReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	if req.Namespace != KAPP_GATEWAY_NAMESPACE || req.Name != KAPP_GATEWAY_NAME {
		return ctrl.Result{}, nil
	}

	task := &GatewayReconcilerTask{
		GatewayReconciler: r,
		ctx:               context.Background(),
	}

	return ctrl.Result{}, task.Run(req)
}

func NewGatewayReconciler(mgr ctrl.Manager) *GatewayReconciler {
	return &GatewayReconciler{NewBaseReconciler(mgr, "HttpRoute")}
}

type KalmGatewayRequestMapper struct {
	*BaseReconciler
}

func (r *KalmGatewayRequestMapper) Map(handler.MapObject) []reconcile.Request {
	return []reconcile.Request{{NamespacedName: types.NamespacedName{Namespace: KAPP_GATEWAY_NAMESPACE, Name: KAPP_GATEWAY_NAME}}}
}

func (r *GatewayReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&v1beta1.Gateway{}).
		Watches(
			&source.Kind{Type: &corev1alpha1.HttpsCert{}},
			&handler.EnqueueRequestsFromMapFunc{
				ToRequests: &KalmGatewayRequestMapper{r.BaseReconciler},
			},
		).
		Complete(r)
}
