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

	corev1alpha1 "github.com/kapp-staging/kapp/controller/api/v1alpha1"
	ctrl "sigs.k8s.io/controller-runtime"
)

const (
	KAPP_GATEWAY_NAMESPACE = "istio-system"
	KAPP_GATEWAY_NAME      = "kapp-gateway"
)

type GatewayReconcilerTask struct {
	*GatewayReconciler
	ctx   context.Context
	gw    *v1beta1.Gateway
	certs []*corev1alpha1.HttpsCert
}

func (r *GatewayReconcilerTask) WarningEvent(err error, msg string, args ...interface{}) {
	r.EmitWarningEvent(r.gw, err, msg, args...)
}

func (r *GatewayReconcilerTask) NormalEvent(reason, msg string, args ...interface{}) {
	r.EmitNormalEvent(r.gw, reason, msg, args...)
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

func (r *GatewayReconcilerTask) Run(req ctrl.Request) error {
	if err := r.ReconcileNamespace(); err != nil {
		return err
	}

	isCreate := false
	if err := r.Reader.Get(r.ctx, req.NamespacedName, r.gw); err != nil {
		if !errors.IsNotFound(err) {
			return err
		}

		isCreate = true
	}

	gw := r.gw
	gw.Name = KAPP_GATEWAY_NAME
	gw.Namespace = KAPP_GATEWAY_NAMESPACE

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

	if isCreate {
		if err := r.Create(r.ctx, gw); err != nil {
			r.WarningEvent(err, "create gateway error.")
			return err
		}
	} else {
		if err := r.Update(r.ctx, gw); err != nil {
			r.WarningEvent(err, "update gateway error.")
			return err
		}
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
		gw:                &v1beta1.Gateway{},
	}

	return ctrl.Result{}, task.Run(req)
}

func NewGatewayReconciler(mgr ctrl.Manager) *GatewayReconciler {
	return &GatewayReconciler{NewBaseReconciler(mgr, "HttpRoute")}
}

type KappGatewayRequestMapper struct {
	*BaseReconciler
}

func (r *KappGatewayRequestMapper) Map(handler.MapObject) []reconcile.Request {
	return []reconcile.Request{{NamespacedName: types.NamespacedName{Namespace: KAPP_GATEWAY_NAMESPACE, Name: KAPP_GATEWAY_NAME}}}
}

func (r *GatewayReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&v1beta1.Gateway{}).
		Watches(
			&source.Kind{Type: &corev1alpha1.HttpsCert{}},
			&handler.EnqueueRequestsFromMapFunc{
				ToRequests: &KappGatewayRequestMapper{r.BaseReconciler},
			},
		).
		Complete(r)
}
