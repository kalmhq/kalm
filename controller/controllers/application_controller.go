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
	"strconv"
	"strings"
	"time"

	js "github.com/dop251/goja"
	"github.com/go-logr/logr"
	corev1alpha1 "github.com/kapp-staging/kapp/controller/api/v1alpha1"
	"github.com/kapp-staging/kapp/controller/lib/files"
	"github.com/kapp-staging/kapp/controller/utils"
	"github.com/kapp-staging/kapp/controller/vm"
	"github.com/xeipuuv/gojsonschema"
	istioNetworkingV1Beta1 "istio.io/api/networking/v1beta1"
	istioV1Beta1 "istio.io/client-go/pkg/apis/networking/v1beta1"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// ApplicationReconciler reconciles a Application object
type ApplicationReconciler struct {
	client.Client
	Reader client.Reader
	Log    logr.Logger
	Scheme *runtime.Scheme
}

type ApplicationReconcilerTask struct {
	*ApplicationReconciler
	Log logr.Logger

	// The following fields will be filled by calling SetupAttributes() function
	ctx         context.Context
	application *corev1alpha1.Application

	// resources
	namespace      *coreV1.Namespace
	gateway        *istioV1Beta1.Gateway
	pluginBindings *corev1alpha1.ApplicationPluginBindingList
}

var ownerKey = ".metadata.controller"
var apiGVStr = corev1alpha1.GroupVersion.String()
var finalizerName = "storage.finalizers.kapp.dev"

// +kubebuilder:rbac:groups=core.kapp.dev,resources=applications,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=applications/status,verbs=get;update;patch
// +kubebuilder:rbac:groups="",resources=namespaces,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="",resources=configmaps,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=networking.istio.io,resources=gateways,verbs=*
// +kubebuilder:rbac:groups=networking.istio.io,resources=virtualservices,verbs=*

// This is for dashboard. We will run dashboard in kube-system namespace too.
// +kubebuilder:rbac:groups=metrics.k8s.io,resources=*,verbs=*

func (r *ApplicationReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	task := &ApplicationReconcilerTask{
		ApplicationReconciler: r,
		ctx:                   context.Background(),
		Log:                   r.Log.WithValues("application", req.NamespacedName),
	}

	task.Log.Info("=========== start reconciling ===========")
	defer task.Log.Info("=========== reconciling done ===========")

	return ctrl.Result{}, task.Run(req)
}

func (r *ApplicationReconciler) SetupWithManager(mgr ctrl.Manager) error {
	if err := mgr.GetFieldIndexer().IndexField(&coreV1.Namespace{}, ownerKey, func(rawObj runtime.Object) []string {
		owner := metaV1.GetControllerOf(rawObj.(*coreV1.Namespace))

		if owner == nil {
			return nil
		}

		if owner.APIVersion != apiGVStr || owner.Kind != "Application" {
			return nil
		}

		return []string{owner.Name}
	}); err != nil {
		return err
	}

	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.Application{}).
		Owns(&coreV1.Namespace{}).
		Owns(&istioV1Beta1.Gateway{}).
		Complete(r)
}

func (r *ApplicationReconcilerTask) Run(req ctrl.Request) error {
	var application corev1alpha1.Application

	if err := r.Reader.Get(r.ctx, req.NamespacedName, &application); err != nil {
		return client.IgnoreNotFound(err)
	}

	// reset labels is for test purpose. If this breaks something. Feel free to modify this logic.
	// Don't forget fix tests as well.
	application.ObjectMeta.Labels = nil

	r.application = &application

	if err := r.SetupAttributes(req); err != nil {
		return err
	}

	if err := r.LoadResources(); err != nil {
		return err
	}

	if err := r.HandleDelete(); err != nil {
		return err
	}

	if !r.application.ObjectMeta.DeletionTimestamp.IsZero() {
		return nil
	}

	if err := r.ReconcileNamespace(); err != nil {
		return err
	}

	if err := r.ReconcileGateway(); err != nil {
		return err
	}

	if err := r.ReconcileComponents(); err != nil {
		return err
	}

	if err := r.ReconcileConfigMaps(); err != nil {
		return err
	}

	if err := r.runPlugins(ApplicationPluginMethodBeforeApplicationSave, &application, &application); err != nil {
		r.Log.Error(err, "run before save plugin error.")
	}

	if err := r.Update(r.ctx, &application); err != nil {
		return err
	}

	if err := r.runPlugins(ApplicationPluginMethodAfterApplicationSaved, nil, nil); err != nil {
		r.Log.Error(err, "run after save plugin error.")
	}

	return nil
}

func (r *ApplicationReconcilerTask) HandleDelete() (err error) {
	if r.application.ObjectMeta.DeletionTimestamp.IsZero() {
		if !utils.ContainsString(r.application.ObjectMeta.Finalizers, finalizerName) {
			r.application.ObjectMeta.Finalizers = append(r.application.ObjectMeta.Finalizers, finalizerName)
			if err := r.Update(r.ctx, r.application); err != nil {
				return err
			}
			r.Log.Info("add finalizer", r.application.Namespace, r.application.Name)
		}
	} else {
		if utils.ContainsString(r.application.ObjectMeta.Finalizers, finalizerName) {
			if r.namespace != nil {
				if err := r.Delete(r.ctx, r.namespace); err != nil {
					r.Log.Error(err, "Delete Namespace error.")
					return err
				}
			}

			if r.gateway != nil {
				if err := r.Delete(r.ctx, r.gateway); err != nil {
					r.Log.Error(err, "Delete gateway error.")
					return err
				}
			}

			r.application.ObjectMeta.Finalizers = utils.RemoveString(r.application.ObjectMeta.Finalizers, finalizerName)
			if err := r.Update(r.ctx, r.application); err != nil {
				r.Log.Error(err, "Remove application finalizer failed.")
				return err
			}
		}
	}

	return nil
}

func (r *ApplicationReconcilerTask) SetupAttributes(req ctrl.Request) (err error) {
	var application corev1alpha1.Application
	err = r.Reader.Get(r.ctx, req.NamespacedName, &application)

	if err != nil {
		err := client.IgnoreNotFound(err)

		if err != nil {
			r.Log.Error(err, "Get application error")
		}

		return err
	}

	r.application = &application
	return nil
}

func (r *ApplicationReconcilerTask) LoadResources() (err error) {
	var ns coreV1.Namespace
	if err := r.Reader.Get(r.ctx, types.NamespacedName{Name: r.application.Name}, &ns); err != nil {
		if !errors.IsNotFound(err) {
			r.Log.Error(err, "Get Namespace error.")
			return err
		}
	} else {
		r.namespace = &ns
	}

	var gateway istioV1Beta1.Gateway
	if err := r.Reader.Get(r.ctx, types.NamespacedName{Namespace: r.application.Name, Name: "gateway"}, &gateway); err != nil {
		if !errors.IsNotFound(err) {
			r.Log.Error(err, "Get gateway error.")
			return err
		}
	} else {
		r.gateway = &gateway
	}

	return nil
}

func (r *ApplicationReconcilerTask) ReconcileNamespace() (err error) {
	if r.namespace == nil {
		ns := &coreV1.Namespace{
			ObjectMeta: metaV1.ObjectMeta{
				Name: r.application.Name,
				Labels: map[string]string{
					"istio-injection": "enabled",
				},
			},
		}

		if err := ctrl.SetControllerReference(r.application, ns, r.Scheme); err != nil {
			r.Log.Error(err, "SetControllerReference error when creating namespace.")
			return err
		}

		if err := r.Create(r.ctx, ns); err != nil {
			r.Log.Error(err, "create namespace failed")
			return err
		}

		r.namespace = ns
		r.Log.Info("namespace created.")
	} else {
		if err := ctrl.SetControllerReference(r.application, r.namespace, r.Scheme); err != nil {
			r.Log.Error(err, "SetControllerReference error when updating namespace.")
			return err
		}

		if len(r.namespace.Labels) == 0 {
			r.namespace.Labels = map[string]string{}
		}

		r.namespace.Labels["istio-injection"] = "enabled"

		if r.namespace.DeletionTimestamp != nil {
			r.namespace.DeletionTimestamp = nil
			if err := r.Update(r.ctx, r.namespace); err != nil {
				r.Log.Error(err, "Clear namespace deletion timestamp error.")
				return err
			}
		}

		if err := r.Update(r.ctx, r.namespace); err != nil {
			r.Log.Error(err, "Update namespace error.")
			return err
		}
	}

	return nil
}

func (r *ApplicationReconcilerTask) ReconcileGateway() error {
	if r.gateway == nil {
		gw := &istioV1Beta1.Gateway{
			ObjectMeta: metaV1.ObjectMeta{
				Name:      "gateway",
				Namespace: r.application.Name,
			},
			Spec: istioNetworkingV1Beta1.Gateway{
				Selector: map[string]string{
					"istio": "ingressgateway",
				},
				Servers: []*istioNetworkingV1Beta1.Server{
					{
						Hosts: []string{"*"},
						Port: &istioNetworkingV1Beta1.Port{
							Number:   80,
							Protocol: "HTTP",
							Name:     "http",
						},
					},
				},
			},
		}

		// todo how to get noticed when ingressPluginBinding changed?
		if err := r.ensureHttpsConfigOfGateway(gw); err != nil {
			return err
		}

		if err := ctrl.SetControllerReference(r.application, gw, r.Scheme); err != nil {
			r.Log.Error(err, "SetControllerReference error when creating gateway.")
			return err
		}

		if err := r.Create(r.ctx, gw); err != nil {
			r.Log.Error(err, "create gateway failed")
			return err
		}

		r.gateway = gw
		r.Log.Info("gateway created.")
	} else {
		if err := r.ensureHttpsConfigOfGateway(r.gateway); err != nil {
			return err
		}

		if err := ctrl.SetControllerReference(r.application, r.gateway, r.Scheme); err != nil {
			r.Log.Error(err, "SetControllerReference error when updating gateway.")
			return err
		}

		if r.gateway.DeletionTimestamp != nil {
			r.gateway.DeletionTimestamp = nil
			if err := r.Update(r.ctx, r.gateway); err != nil {
				r.Log.Error(err, "Clear gateway deletion timestamp error.")
				return err
			}
		}

		if err := r.Update(r.ctx, r.gateway); err != nil {
			r.Log.Error(err, "Update gateway error.")
			return err
		}
	}

	return nil
}

func (r *ApplicationReconcilerTask) ReconcileComponents() error {

	var componentList corev1alpha1.ComponentList

	if err := r.Reader.List(r.ctx, &componentList, client.InNamespace(r.namespace.Name)); err != nil {
		r.Log.Error(err, "get componentList error")
		return err
	}

	timeString := time.Now().String()
	for _, item := range componentList.Items {
		copiedComponent := item.DeepCopy()
		if copiedComponent.Annotations == nil {
			copiedComponent.Annotations = make(map[string]string)
		}

		copiedComponent.Annotations["lastTouchedByApplication"] = timeString

		//?
		ctrl.SetControllerReference(r.application, copiedComponent, r.Scheme)

		if err := r.Patch(r.ctx, copiedComponent, client.MergeFrom(&item)); err != nil {
			r.Log.Error(err, "patch component failed")
			return err
		}
	}

	return nil
}

func (r *ApplicationReconcilerTask) ReconcileConfigMaps() error {
	var configMap coreV1.ConfigMap

	if err := r.Reader.Get(r.ctx, types.NamespacedName{Namespace: r.namespace.Name, Name: files.KAPP_CONFIG_MAP_NAME}, &configMap); err != nil {
		if errors.IsNotFound(err) {
			configMap = coreV1.ConfigMap{
				ObjectMeta: metaV1.ObjectMeta{
					Name:      files.KAPP_CONFIG_MAP_NAME,
					Namespace: r.namespace.Name,
				},
			}

			if err := ctrl.SetControllerReference(r.application, &configMap, r.Scheme); err != nil {
				r.Log.Error(err, "SetControllerReference error when creating configmap.")
				return err
			}

			if err := r.Create(r.ctx, &configMap); err != nil {
				r.Log.Error(err, "create kapp default config map error")
				return err
			} else {
				return nil
			}
		} else {
			r.Log.Error(err, "get kapp default config map error")
			return err
		}
	}

	if err := ctrl.SetControllerReference(r.application, &configMap, r.Scheme); err != nil {
		r.Log.Error(err, "SetControllerReference error when creating configmap.")
		return err
	}

	// TODO should we use patch here to avoid conflict
	if err := r.Update(r.ctx, &configMap); err != nil {
		r.Log.Error(err, "update configmap error")
		return err
	}

	return nil
}

func (r *ApplicationReconcilerTask) runPlugins(methodName string, desc interface{}, args ...interface{}) (err error) {
	if r.pluginBindings == nil {
		var bindings corev1alpha1.ApplicationPluginBindingList
		if err := r.Reader.List(r.ctx, &bindings, client.InNamespace(r.application.Name)); err != nil {
			r.Log.Error(err, "get plugin bindings error")
			return err
		}

		r.pluginBindings = &bindings
	}

	if r.pluginBindings == nil {
		return nil
	}

	for _, binding := range r.pluginBindings.Items {
		if binding.DeletionTimestamp != nil || binding.Spec.IsDisabled {
			continue
		}

		pluginProgram, config, err := r.findPluginAndValidateConfigNew(&binding, methodName)

		if err != nil {
			return err
		}

		if pluginProgram == nil {
			continue
		}

		rt := vm.InitRuntime()

		r.insertBuildInPluginImpls(rt, &binding, methodName, config, desc, args)

		err = vm.RunMethod(
			rt,
			pluginProgram.Program,
			methodName,
			config,
			desc,
			args...,
		)

		if err != nil {
			r.Log.Error(err, fmt.Sprintf("Run plugin error. methodName: %s,  pluginName: %s", methodName, binding.Spec.PluginName))
			return err
		}
	}

	return nil
}

func (r *ApplicationReconcilerTask) findPluginAndValidateConfigNew(pluginBinding *corev1alpha1.ApplicationPluginBinding, methodName string) (*ApplicationPluginProgram, []byte, error) {
	pluginProgram := applicationPluginsCache.Get(pluginBinding.Spec.PluginName)

	if pluginProgram == nil {
		return nil, nil, fmt.Errorf("Can't find plugin %s in cache.", pluginBinding.Spec.PluginName)
	}

	if !pluginProgram.Methods[methodName] {
		return nil, nil, nil
	}

	if pluginProgram.ConfigSchema != nil {
		if pluginBinding.Spec.Config == nil {
			return nil, nil, fmt.Errorf("ApplicationPlugin %s require configuration.", pluginBinding.Spec.PluginName)
		}

		pluginConfig := gojsonschema.NewStringLoader(string(pluginBinding.Spec.Config.Raw))
		res, err := pluginProgram.ConfigSchema.Validate(pluginConfig)

		if err != nil {
			return nil, nil, err
		}

		if !res.Valid() {
			return nil, nil, fmt.Errorf(res.Errors()[0].String())
		}

		return pluginProgram, pluginBinding.Spec.Config.Raw, nil
	}

	return pluginProgram, nil, nil
}

type BuiltinApplicationPluginIngressConfig struct {
	Hosts []string `json:"hosts"`
	Paths []string `json:"paths"`

	HttpsCert          string `json:"httpsCert"`
	EnableHttps        bool   `json:"enableHttps"`
	StripPath          bool   `json:"stripPath"`
	UrlCaseInsensitive bool   `json:"urlCaseInsensitive"`

	Destinations []struct {
		Destination string `json:"destination"`
		Weight      int    `json:"weight"`
	} `json:"destinations"`
}

func (r *ApplicationReconcilerTask) insertBuildInPluginImpls(rt *js.Runtime, binding *corev1alpha1.ApplicationPluginBinding, methodName string, configBytes []byte, desc interface{}, args []interface{}) {
	switch binding.Spec.PluginName {
	case corev1alpha1.KappBuiltinApplicationPluginIngress:
		if methodName != ApplicationPluginMethodAfterApplicationSaved {
			return
		}

		rt.Set("__builtinApplicationPluginIngress", func(_ js.FunctionCall) js.Value {
			var config BuiltinApplicationPluginIngressConfig

			_ = json.Unmarshal(configBytes, &config)

			var vs istioV1Beta1.VirtualService
			name := binding.Name

			err := r.Reader.Get(r.ctx, types.NamespacedName{
				Name:      name,
				Namespace: binding.Namespace,
			}, &vs)

			isCreate := false

			if err != nil {
				if !errors.IsNotFound(err) {
					r.Log.Error(err, "__builtinApplicationPluginIngress error.")
					// TODO pass error to js
					return rt.ToValue(nil)
				} else {
					isCreate = true
				}
			}

			var routes []*istioNetworkingV1Beta1.HTTPRoute

			for _, path := range config.Paths {
				match := &istioNetworkingV1Beta1.HTTPMatchRequest{
					Uri: &istioNetworkingV1Beta1.StringMatch{
						MatchType: &istioNetworkingV1Beta1.StringMatch_Prefix{
							Prefix: path,
						},
					},
				}

				httpRoute := &istioNetworkingV1Beta1.HTTPRoute{
					Match: []*istioNetworkingV1Beta1.HTTPMatchRequest{match},
					Route: []*istioNetworkingV1Beta1.HTTPRouteDestination{},
				}

				if config.StripPath {
					httpRoute.Rewrite = &istioNetworkingV1Beta1.HTTPRewrite{
						Uri: "/",
					}
				}

				for _, destination := range config.Destinations {
					colon := strings.LastIndexByte(destination.Destination, ':')
					var host, port string

					if colon == -1 {
						host = destination.Destination
					} else {
						host = destination.Destination[:colon]
						port = destination.Destination[colon+1:]
					}

					desc := &istioNetworkingV1Beta1.HTTPRouteDestination{
						Destination: &istioNetworkingV1Beta1.Destination{
							Host: host,
						},
						Weight: int32(destination.Weight),
					}

					if port != "" {
						p, _ := strconv.ParseUint(port, 0, 32)
						desc.Destination.Port = &istioNetworkingV1Beta1.PortSelector{
							Number: uint32(p),
						}
					}

					httpRoute.Route = append(httpRoute.Route, desc)
				}

				routes = append(routes, httpRoute)
			}

			vs.Name = name
			vs.Namespace = binding.Namespace
			vs.Spec = istioNetworkingV1Beta1.VirtualService{
				Gateways: []string{"gateway"},
				Hosts:    config.Hosts,
				Http:     routes,
			}

			if isCreate {
				err := r.Create(r.ctx, &vs)
				if err != nil {
					r.Log.Error(err, "create vs error.")
					return rt.ToValue(nil)
				}
			} else {
				err := r.Update(r.ctx, &vs)
				if err != nil {
					r.Log.Error(err, "create vs error.")
					return rt.ToValue(nil)
				}
			}

			return rt.ToValue(nil)
		})
	default:
	}
}

func (r *ApplicationReconcilerTask) ensureHttpsConfigOfGateway(gw *istioV1Beta1.Gateway) error {

	var appPluginBindingList corev1alpha1.ApplicationPluginBindingList
	if err := r.List(r.ctx, &appPluginBindingList, client.InNamespace(gw.Namespace)); err != nil {
		return client.IgnoreNotFound(err)
	}

	var expectedHttpsServer []*istioNetworkingV1Beta1.Server
	for _, appPluginBinding := range appPluginBindingList.Items {
		if appPluginBinding.Spec.PluginName != corev1alpha1.KappBuiltinApplicationPluginIngress {
			continue
		}

		var ingressConfig BuiltinApplicationPluginIngressConfig
		if err := json.Unmarshal(appPluginBinding.Spec.Config.Raw, &ingressConfig); err != nil {
			continue
		}

		var httpsCert corev1alpha1.HttpsCert
		if ingressConfig.HttpsCert == "" {
			// todo check if suitable cert already exists
			continue
		} else {
			if err := r.Get(r.ctx, types.NamespacedName{
				Namespace: gw.Namespace,
				Name:      ingressConfig.HttpsCert,
			}, &httpsCert); err != nil {
				// todo fail to find given httpsCert
				// should emit event log to warn user
				continue
			}
		}

		_, certSecretName := getCertAndCertSecretName(httpsCert)

		curServer := istioNetworkingV1Beta1.Server{
			Hosts: ingressConfig.Hosts,
			Port: &istioNetworkingV1Beta1.Port{
				Number:   443,
				Protocol: "HTTPS",
				Name:     "https",
			},
			Tls: &istioNetworkingV1Beta1.Server_TLSOptions{
				Mode:           istioNetworkingV1Beta1.Server_TLSOptions_SIMPLE,
				CredentialName: certSecretName,
			},
		}

		expectedHttpsServer = append(expectedHttpsServer, &curServer)
	}

	var existServersExceptHttps []*istioNetworkingV1Beta1.Server
	for _, s := range gw.Spec.Servers {
		if s.Port != nil && s.Port.Number == 443 {
			continue
		}

		existServersExceptHttps = append(existServersExceptHttps, s)
	}

	serverConfigInWhole := append(existServersExceptHttps, expectedHttpsServer...)
	gw.Spec.Servers = serverConfigInWhole

	return nil
}
