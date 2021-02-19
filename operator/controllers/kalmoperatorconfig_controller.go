/*
Copyright 2020 Kalm Dev.

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

	"github.com/go-logr/logr"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	installv1alpha1 "github.com/kalmhq/kalm/operator/api/v1alpha1"
	"github.com/kalmhq/kalm/operator/utils"
	promconfig "github.com/prometheus/prometheus/config"
	"istio.io/pkg/log"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"

	"strconv"
	"time"

	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/serializer"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
	"sigs.k8s.io/controller-runtime/pkg/source"
)

const (
	NamespaceKalmSystem = "kalm-system"
	//KalmImgRepo          = "quay.io/kalmhq/kalm"
	NamespaceCertManager = "cert-manager"
	NamespaceIstio       = "istio-system"

	KalmDashboardImgRepo  = "kalmhq/kalm"
	KalmControllerImgRepo = "kalmhq/kalm-controller"
	FallbackImgVersion    = "latest"
)

// KalmOperatorConfigReconciler reconciles a KalmOperatorConfig object
type KalmOperatorConfigReconciler struct {
	client.Client
	Log    logr.Logger
	Scheme *runtime.Scheme
	Ctx    context.Context
	config *installv1alpha1.KalmOperatorConfig
}

//go:generate mkdir -p tmp
//go:generate sh -c "make -C ../../controller manifests-for-operator" # make sure CRD & RBAC is up to date
//go:generate sh -c "kustomize build ../../controller/config/default > tmp/kalm.yaml"
//go:generate sh -c "kustomize build ../resources/istio > tmp/istio.yaml"
//go:generate sh -c "cp ../resources/cert-manager/cert-manager.yaml tmp/cert-manager.yaml"
//go:generate sh -c "cp ../resources/istiocontrolplane.yaml tmp/istiocontrolplane.yaml"
//go:generate sh -c "cp ../resources/istio-prom-recording-rules.yaml tmp/istio-prom-recording-rules.yaml"
//go:generate go-bindata -pkg controllers -nometadata -prefix tmp -o resources.gen.go ./tmp
//go:generate rm -rf ./tmp

// +kubebuilder:rbac:groups=install.kalm.dev,resources=kalmoperatorconfigs,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=install.kalm.dev,resources=kalmoperatorconfigs/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=policy,resources=poddisruptionbudgets*,verbs=*
// +kubebuilder:rbac:groups=policy,resources=podsecuritypolicies,verbs=*
// +kubebuilder:rbac:groups=monitoring.coreos.com,resources=servicemonitors,verbs=get;create
// +kubebuilder:rbac:groups=apiextensions.k8s.io,resources=customresourcedefinitions;customresourcedefinitions.apiextensions.k8s.io,verbs=*
// +kubebuilder:rbac:groups=apiregistration.k8s.io,resources=apiservices,verbs=get;list;watch;update
// +kubebuilder:rbac:groups=auditregistration.k8s.io,resources=auditsinks,verbs=get;list;watch;update
// +kubebuilder:rbac:groups=rbac.authorization.k8s.io,resources=clusterroles;clusterrolebindings;roles;rolebindings,verbs=*
// +kubebuilder:rbac:groups=apps,resources=deployments;daemonsets;deployments/finalizers;ingresses;replicasets;statefulsets,verbs=*
// +kubebuilder:rbac:groups=extensions,resources=daemonsets;deployments;deployments/finalizers;replicasets;statefulsets;ingresses;ingresses/finalizers,verbs=*
// +kubebuilder:rbac:groups=autoscaling,resources=horizontalpodautoscalers,verbs=*
// +kubebuilder:rbac:groups=admissionregistration.k8s.io,resources=mutatingwebhookconfigurations;validatingwebhookconfigurations,verbs=*
// +kubebuilder:rbac:groups="",resources=namespaces;persistentvolumeclaims;serviceaccounts;endpoints;events;secrets;pods;services;configmaps,verbs=*
// +kubebuilder:rbac:groups=cert-manager.io,resources=*,verbs=*
// +kubebuilder:rbac:groups=acme.cert-manager.io,resources=*,verbs=*
// +kubebuilder:rbac:groups=route.openshift.io,resources=routes/custom-host,verbs=create
// +kubebuilder:rbac:groups=install.istio.io,resources=*,verbs=*
// +kubebuilder:rbac:groups=networking.istio.io,resources=*,verbs=*
// +kubebuilder:rbac:groups=rbac.istio.io,resources=*,verbs=*
// +kubebuilder:rbac:groups=security.istio.io,resources=*,verbs=*
// +kubebuilder:rbac:groups=authentication.istio.io,resources=*,verbs=*
// +kubebuilder:rbac:groups=config.istio.io,resources=*,verbs=*
// +kubebuilder:rbac:groups=core.kalm.dev,resources=*,verbs=*

func (r *KalmOperatorConfigReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	log := r.Log.WithValues("kalmoperatorconfig", req.NamespacedName)

	log.Info("KalmOperatorConfigReconciler reconciling...")

	// only allow one operator config in a namespace. If there is no config or more than one,
	// this controller won't do anything to the system.

	var configs installv1alpha1.KalmOperatorConfigList
	if err := r.List(r.Ctx, &configs); err != nil {
		log.Error(err, "list configs error")
		return ctrl.Result{}, err
	}

	if len(configs.Items) == 0 {
		log.Info("No config found.")
		return ctrl.Result{}, nil
	}

	if len(configs.Items) > 1 {
		err := fmt.Errorf("more than one operator configs found")
		log.Error(err, "Controller won't be working until there is only one config")
		return ctrl.Result{}, err
	}

	config := &configs.Items[0]
	r.config = config

	err := r.reconcileResources()
	if err == retryLaterErr {
		r.Log.Info("Dependency not ready, retry after 5 seconds")
		return ctrl.Result{RequeueAfter: 5 * time.Second}, nil
	} else if err != nil {
		r.Log.Info("reconcileResources fail", "error", err)
	}

	return ctrl.Result{}, err
}

func (r *KalmOperatorConfigReconciler) applyFromYaml(yamlName string) error {
	r.Log.Info(fmt.Sprintf("apply yaml: %s", yamlName))

	fileContent := MustAsset(yamlName)

	objectsBytes := utils.SeparateYamlBytes(fileContent)
	decode := serializer.NewCodecFactory(r.Scheme).UniversalDeserializer().Decode

	for _, objectBytes := range objectsBytes {
		object, _, err := decode(objectBytes, nil, nil)

		if err != nil {
			r.Log.Error(err, fmt.Sprintf("Decode yaml %s error.", yamlName))
			return err
		}

		objectKey, err := client.ObjectKeyFromObject(object)

		if err != nil {
			r.Log.Error(err, "get Object Key from object error")
			return err
		}

		apiVersion, kind := object.GetObjectKind().GroupVersionKind().ToAPIVersionAndKind()
		fetchedObj, err := r.Scheme.New(object.GetObjectKind().GroupVersionKind())

		if err != nil {
			r.Log.Error(err, fmt.Sprintf("New object error, apiVersion: %s, kind: %s", apiVersion, kind))
			return err
		}

		if err := r.Client.Get(r.Ctx, objectKey, fetchedObj); err != nil {
			if errors.IsNotFound(err) {
				err = r.Client.Create(r.Ctx, object)

				if err != nil {
					r.Log.Error(err, fmt.Sprintf("Create object error: %v", objectKey))
					return err
				}

				r.Log.Info(fmt.Sprintf("Create object %s", objectKey.String()))
				continue
			} else {
				r.Log.Error(err, fmt.Sprintf("Get object failed. %v", objectKey))
				return err
			}
		}

		if err := r.Client.Patch(r.Ctx, object, client.Merge); err != nil {
			r.Log.Error(err, fmt.Sprintf("Apply object failed. %v", objectKey))
			return err
		}
		// r.Log.Info(fmt.Sprintf("Patch object %s, kind: %s", objectKey.String(), object.GetObjectKind()))
	}

	return nil
}

var retryLaterErr = fmt.Errorf("retry later")

const istioPromRecordingRulesFileName = "istio-prom-recording-rules.yaml"

func (r *KalmOperatorConfigReconciler) reconcileResources() error {
	config := r.config

	if _, err := r.updateInstallProcess(); err != nil {
		return err
	}

	// if _, err := r.updateInstallProcess(installv1alpha1.InstallStateInstalling); err != nil {
	// 	return err
	// }

	if !config.Spec.SkipCertManagerInstallation {
		if err := r.applyFromYaml("cert-manager.yaml"); err != nil {
			log.Error(err, "install certManager error.")
			return err
		}

		// if _, err := r.updateInstallProcess(installv1alpha1.InstallStateInstallingCertMgr); err != nil {
		// 	return err
		// }
	}

	if !config.Spec.SkipIstioInstallation {
		if err := r.applyFromYaml("istio.yaml"); err != nil {
			log.Error(err, "install istio error.")
			return err
		}

		if err := r.applyFromYaml("istiocontrolplane.yaml"); err != nil {
			log.Error(err, "install istio plane error.")
			return err
		}

		if err := r.AddRecordingRulesForIstioPrometheus(); err != nil {
			log.Error(err, "add recording rules form istio prometheus failed.")
			return err
		}

		// if _, err := r.updateInstallProcess(installv1alpha1.InstallStateInstallingIstio); err != nil {
		// 	return err
		// }
	}

	// check dp to determine if install is ready, dp will be ready after crd
	if !config.Spec.SkipCertManagerInstallation && !config.Spec.SkipIstioInstallation {
		if !r.isIstioReady() || !r.isCertManagerReady() {
			return nil
		}
	} else if !config.Spec.SkipCertManagerInstallation {
		if !r.isCertManagerReady() {
			return nil
		}
	} else if !config.Spec.SkipIstioInstallation {
		if !r.isIstioReady() {
			return nil
		}
	}

	configSpec := config.Spec
	if configSpec.BYOCModeConfig != nil {
		return r.reconcileBYOCMode()
	} else if configSpec.LocalModeConfig != nil {
		return r.reconcileLocalMode()
	} else {
		r.Log.Info("must specify at least one of: byocModeConfig and localModeConfig")
		return nil
	}
}

func (r *KalmOperatorConfigReconciler) AddRecordingRulesForIstioPrometheus() error {
	cmPrometheus := corev1.ConfigMap{}
	err := r.Get(r.Ctx, types.NamespacedName{Name: "prometheus", Namespace: "istio-system"}, &cmPrometheus)

	if err != nil {
		if !errors.IsNotFound(err) {
			return err
		}

		// Not found. It should be created later by istio-operator
		// Skip for now.
		return nil
	}

	dpPrometheus := appsv1.Deployment{}
	err = r.Get(r.Ctx, types.NamespacedName{Name: "prometheus", Namespace: "istio-system"}, &dpPrometheus)
	if err != nil {
		if !errors.IsNotFound(err) {
			return err
		}

		// Not found. It should be created later by istio-operator
		// Skip for now.
		return nil
	}

	v := cmPrometheus.Data["prometheus.yml"]
	pConfig, _ := promconfig.Load(v)

	// this can executes multi-times
	hasRecordingRules := utils.ContainsString(pConfig.RuleFiles, istioPromRecordingRulesFileName)
	if !hasRecordingRules {
		pConfig.RuleFiles = append(pConfig.RuleFiles, istioPromRecordingRulesFileName)

		cmPrometheus.Data["prometheus.yml"] = pConfig.String()
		cmPrometheus.Data[istioPromRecordingRulesFileName] = string(MustAsset("istio-prom-recording-rules.yaml"))

		if err := r.Update(r.Ctx, &cmPrometheus); err != nil {
			return err
		}

		// trigger update
		dpPrometheusCopy := dpPrometheus.DeepCopy()
		dpPrometheusCopy.Spec.Template.ObjectMeta.Labels["date"] = strconv.Itoa(int(time.Now().Unix()))

		err = r.Patch(r.Ctx, dpPrometheusCopy, client.MergeFrom(&dpPrometheus))

		if err != nil {
			return err
		}
	}

	return nil
}

func (r *KalmOperatorConfigReconciler) checkIfDPReady(ctx context.Context, ns string, dpNameOpt ...string) bool {
	for _, dpName := range dpNameOpt {
		var dp appsv1.Deployment
		err := r.Get(ctx, types.NamespacedName{Name: dpName, Namespace: ns}, &dp)
		if err != nil {
			return false
		}

		if dp.Status.ReadyReplicas < 1 {
			r.Log.Info("DP not ready", "dp", dpName, "ns", ns)
			return false
		}
	}

	return true
}

//func (r *KalmOperatorConfigReconciler) checkIfCRDReady(ctx context.Context, crdNameOpt []string) bool {
//	for _, crdName := range crdNameOpt {
//		var crd apiextv1beta1.CustomResourceDefinition
//		err := r.Get(ctx, client.ObjectKey{Name: crdName}, &crd)
//		if err != nil {
//			r.Log.Info("CRD not ready", "crd", crdName, "err", err)
//			return false
//		}
//	}
//
//	return true
//}

// make sure cert-manager is ready
func (r *KalmOperatorConfigReconciler) isCertManagerReady() bool {

	dps := []string{"cert-manager", "cert-manager-cainjector", "cert-manager-webhook"}

	return r.checkIfDPReady(r.Ctx, NamespaceCertManager, dps...)
}

func (r *KalmOperatorConfigReconciler) isIstioReady() bool {
	dps := []string{"istiod", "istio-ingressgateway", "prometheus"}

	return r.checkIfDPReady(r.Ctx, NamespaceIstio, dps...)
}

func (r *KalmOperatorConfigReconciler) isKalmControllerReady() bool {
	dps := []string{"kalm-controller"}

	return r.checkIfDPReady(r.Ctx, NamespaceKalmSystem, dps...)
}

func (r *KalmOperatorConfigReconciler) isKalmDashboardReady() bool {
	dps := []string{"kalm", "auth-proxy"}

	return r.checkIfDPReady(r.Ctx, NamespaceKalmSystem, dps...)
}

func (r *KalmOperatorConfigReconciler) isACMEServerReady() bool {
	dps := []string{"acme-server"}

	return r.checkIfDPReady(r.Ctx, NamespaceKalmSystem, dps...)
}

func (r *KalmOperatorConfigReconciler) isKalmDashboardAccessReady() bool {
	clusterIP, clusterHost := r.getClusterIPAndHostname()
	return clusterIP != "" || clusterHost != ""
}

func (r *KalmOperatorConfigReconciler) isACMEServerAccessReady() bool {
	acmeServerIP, acmeServerHostname := r.getACMEServerIPAndHostname()
	return acmeServerIP != "" || acmeServerHostname != ""
}

func (r *KalmOperatorConfigReconciler) isClusterInfoReported() bool {
	status := r.config.Status.BYOCModeStatus
	return status != nil && status.ClusterInfoHasSendToKalmSaaS
}

type KalmIstioPrometheusWather struct{}

func (r *KalmIstioPrometheusWather) Map(obj handler.MapObject) []reconcile.Request {
	if obj.Meta.GetNamespace() != "istio-system" || obj.Meta.GetName() != "prometheus" {
		return nil
	}

	return []reconcile.Request{{NamespacedName: types.NamespacedName{Namespace: "kalm-operator", Name: "reconcile-caused-by-prometheus-config"}}}
}

type KalmEssentialNSWatcher struct{}

func (k KalmEssentialNSWatcher) Map(object handler.MapObject) []reconcile.Request {
	// any change in essential namespace will trigger reconciliation
	targetNamespaces := []string{
		NamespaceIstio,
		NamespaceCertManager,
		NamespaceKalmSystem,
	}

	curNS := object.Meta.GetName()
	for _, targetNs := range targetNamespaces {
		if curNS != targetNs {
			continue
		}

		//fmt.Println("nsObjDetail:", curNS)

		return []reconcile.Request{{
			NamespacedName: types.NamespacedName{
				Name:      "NS-CHANGE",
				Namespace: curNS,
			}},
		}
	}

	return nil
}

type KalmDeploymentInEssentialNSWatcher struct{}

func (k KalmDeploymentInEssentialNSWatcher) Map(object handler.MapObject) []reconcile.Request {
	// any change of dp in targetNS will trigger reconciliation
	targetNamespaces := []string{
		NamespaceIstio,
		NamespaceCertManager,
		NamespaceKalmSystem,
	}

	curNS := object.Meta.GetNamespace()
	for _, targetNs := range targetNamespaces {
		if curNS != targetNs {
			continue
		}

		return []reconcile.Request{{
			NamespacedName: types.NamespacedName{
				Name:      "DP-CHANGE-" + object.Meta.GetName(),
				Namespace: curNS,
			},
		}}
	}

	return nil
}

type DashboardHttpsCertWatcher struct{}

func (w DashboardHttpsCertWatcher) Map(obj handler.MapObject) []reconcile.Request {
	if obj.Meta.GetName() != HttpsCertNameDashboard {
		return nil
	}

	return []reconcile.Request{{
		NamespacedName: types.NamespacedName{
			Name: "HttpsCert-CHANGE-" + HttpsCertNameDashboard,
		},
	}}
}

func (r *KalmOperatorConfigReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&installv1alpha1.KalmOperatorConfig{}).
		Watches(&source.Kind{Type: &corev1.Namespace{}}, &handler.EnqueueRequestsFromMapFunc{
			ToRequests: &KalmEssentialNSWatcher{},
		}).
		Watches(&source.Kind{Type: &appsv1.Deployment{}}, &handler.EnqueueRequestsFromMapFunc{
			ToRequests: &KalmDeploymentInEssentialNSWatcher{},
		}).
		Watches(&source.Kind{Type: &corev1.ConfigMap{}}, &handler.EnqueueRequestsFromMapFunc{
			ToRequests: &KalmIstioPrometheusWather{},
		}).
		// for BYOC mode, watch dashboard HttpsCert
		// Watches(&source.Kind{Type: &v1alpha1.HttpsCert{}}, &handler.EnqueueRequestsFromMapFunc{
		// 	ToRequests: &DashboardHttpsCertWatcher{},
		// }).
		Complete(r)
}

func DecideKalmMode(spec installv1alpha1.KalmOperatorConfigSpec) v1alpha1.KalmMode {
	if spec.BYOCModeConfig != nil {
		return v1alpha1.KalmModeBYOC
	}

	if spec.LocalModeConfig != nil {
		return v1alpha1.KalmModeLocal
	}

	return ""
}
