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
	corev1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
	installv1alpha1 "github.com/kalmhq/kalm/operator/api/v1alpha1"
	"github.com/kalmhq/kalm/operator/utils"
	promconfig "github.com/prometheus/prometheus/config"
	v1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/serializer"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"strconv"
	"time"
)

const (
	NamespaceKalmSystem = "kalm-system"
	KalmImgRepo         = "quay.io/kalmhq/kalm"
)

//var finalizerName = "install.finalizers.kalm.dev"

// KalmOperatorConfigReconciler reconciles a KalmOperatorConfig object
type KalmOperatorConfigReconciler struct {
	client.Client
	Log    logr.Logger
	Scheme *runtime.Scheme
	Reader client.Reader
}

//go:generate mkdir -p tmp
//go:generate sh -c "make -C ../../controller manifests" # make sure CRD & RBAC is up to date
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
	ctx := context.Background()
	log := r.Log.WithValues("kalmoperatorconfig", req.NamespacedName)

	// only allow one operator config in a namespace. If there is no config or more than one,
	// this controller won't do anything to the system.

	var configs installv1alpha1.KalmOperatorConfigList
	if err := r.Reader.List(ctx, &configs); err != nil {
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

	//if config.ObjectMeta.DeletionTimestamp.IsZero() {
	//	if !utils.ContainsString(config.ObjectMeta.Finalizers, finalizerName) {
	//		config.ObjectMeta.Finalizers = append(config.ObjectMeta.Finalizers, finalizerName)
	//		if err := r.Update(ctx, config); err != nil {
	//			return ctrl.Result{}, err
	//		}
	//
	//		log.Info("add finalizer", config.Namespace, config.Name)
	//	}
	//} else {
	//	if utils.ContainsString(config.ObjectMeta.Finalizers, finalizerName) {
	//		if err := r.deleteResources(config, ctx, log); err != nil {
	//			log.Error(err, "delete resources error")
	//			return ctrl.Result{}, err
	//		}
	//
	//		config.ObjectMeta.Finalizers = utils.RemoveString(config.ObjectMeta.Finalizers, finalizerName)
	//
	//		if err := r.Update(ctx, config); err != nil {
	//			log.Error(err, "Remove kalm operator finalizer failed.")
	//			return ctrl.Result{}, err
	//		}
	//	}
	//
	//	return ctrl.Result{}, nil
	//}

	err := r.reconcileResources(config, ctx, log)
	if err == retryLaterErr {
		return ctrl.Result{RequeueAfter: 1 * time.Second}, nil
	}

	return ctrl.Result{}, err
}

func (r *KalmOperatorConfigReconciler) installFromYaml(ctx context.Context, yamlName string) error {
	fileContent := MustAsset(yamlName)

	objectsBytes := utils.SeparateYamlBytes(fileContent)
	decode := serializer.NewCodecFactory(r.Scheme).UniversalDeserializer().Decode

	for _, objectBytes := range objectsBytes {
		object, _, err := decode(objectBytes, nil, nil)

		if err != nil {
			r.Log.Error(err, fmt.Sprintf("Install from yaml %s error.", yamlName))
			return err
		}

		err = r.Client.Create(ctx, object)

		if errors.IsAlreadyExists(err) {
			continue
		}

		if err != nil {
			return err
		}
	}
	return nil
}

var retryLaterErr = fmt.Errorf("retry later")

const istioPromRecordingRulesFileName = "istio-prom-recording-rules.yaml"

func (r *KalmOperatorConfigReconciler) reconcileResources(config *installv1alpha1.KalmOperatorConfig, ctx context.Context, log logr.Logger) error {
	// TODO delete when skip
	if !config.Spec.SkipCertManagerInstallation {
		//r.Log.Info("installing cert-manager")

		if err := r.installFromYaml(ctx, "cert-manager.yaml"); err != nil {
			log.Error(err, "install certManager error.")
			return err
		}
	}

	if !config.Spec.SkipIstioInstallation {
		//r.Log.Info("installing istio")

		if err := r.installFromYaml(ctx, "istio.yaml"); err != nil {
			log.Error(err, "install istio error.")
			return err
		}

		if err := r.installFromYaml(ctx, "istiocontrolplane.yaml"); err != nil {
			log.Error(err, "install istio plane error.")
			return err
		}

		cmPrometheus := corev1.ConfigMap{}
		err := r.Get(ctx, types.NamespacedName{Name: "prometheus", Namespace: "istio-system"}, &cmPrometheus)
		if err != nil {
			return err
		}

		v := cmPrometheus.Data["prometheus.yml"]
		pConfig, _ := promconfig.Load(v)
		if len(pConfig.RuleFiles) <= 0 {
			pConfig.RuleFiles = []string{istioPromRecordingRulesFileName}

			cmPrometheus.Data["prometheus.yml"] = pConfig.String()
			cmPrometheus.Data[istioPromRecordingRulesFileName] = string(MustAsset("istio-prom-recording-rules.yaml"))

			if err := r.Update(ctx, &cmPrometheus); err != nil {
				return err
			}

			// trigger update
			dpPromethues := v1.Deployment{}
			err := r.Get(ctx, types.NamespacedName{Name: "prometheus", Namespace: "istio-system"}, &dpPromethues)
			if err != nil {
				return err
			}

			dpPrometheusCopy := dpPromethues.DeepCopy()
			dpPrometheusCopy.Spec.Template.ObjectMeta.Labels["date"] = strconv.Itoa(int(time.Now().Unix()))

			err = r.Patch(ctx, dpPrometheusCopy, client.MergeFrom(&dpPromethues))
			if err != nil {
				return err
			}
		}
	}

	if !config.Spec.SkipCertManagerInstallation && !config.Spec.SkipIstioInstallation {
		if !r.isIstioReady(ctx) || !r.isCertManagerReady(ctx) {
			return retryLaterErr
		}
	} else if !config.Spec.SkipCertManagerInstallation {
		if !r.isCertManagerReady(ctx) {
			return retryLaterErr
		}
	} else if !config.Spec.SkipIstioInstallation {
		if !r.isIstioReady(ctx) {
			return retryLaterErr
		}
	}

	if !config.Spec.SkipKalmControllerInstallation {
		//r.Log.Info("installing kalm-controller")
		if err := r.installFromYaml(ctx, "kalm.yaml"); err != nil {
			log.Error(err, "install kalm error.")
			return err
		}

		kalmNS := "kalm-system"
		if !r.checkIfDPReady(ctx, kalmNS, "kalm-controller") {
			return retryLaterErr
		}
	}

	if !config.Spec.SkipKalmDashboardInstallation {
		//r.Log.Info("installing kalm-dashboard")

		dashboardVersion := "latest"
		if config.Spec.DashboardVersion != "" {
			dashboardVersion = config.Spec.DashboardVersion
		}

		dashboardName := "kalm"
		expectedDashboard := corev1alpha1.Component{
			ObjectMeta: ctrl.ObjectMeta{
				Namespace: NamespaceKalmSystem,
				Name:      dashboardName,
			},
			Spec: corev1alpha1.ComponentSpec{
				Image:   fmt.Sprintf("%s:%s", KalmImgRepo, dashboardVersion),
				Command: "./kalm-api-server",
				Ports: []corev1alpha1.Port{
					{
						Name:          "http",
						ContainerPort: 3001,
						ServicePort:   80,
					},
				},
			},
		}

		dashboard := corev1alpha1.Component{}
		err := r.Get(ctx, types.NamespacedName{Name: dashboardName, Namespace: NamespaceKalmSystem}, &dashboard)
		if err != nil {
			if !errors.IsNotFound(err) {
				return err
			}

			if err := r.Client.Create(ctx, &expectedDashboard); err != nil {
				return err
			}
		} else {
			dashboard.Spec = expectedDashboard.Spec
			if err := r.Client.Update(ctx, &dashboard); err != nil {
				return err
			}
		}
	}

	return nil
}

func (r *KalmOperatorConfigReconciler) checkIfDPReady(ctx context.Context, ns string, dpNameOpt ...string) bool {
	for _, dpName := range dpNameOpt {
		var dp v1.Deployment
		err := r.Get(ctx, types.NamespacedName{Name: dpName, Namespace: ns}, &dp)
		if err != nil {
			return false
		}

		if dp.Status.ReadyReplicas < 1 {
			return false
		}
	}

	return true
}

func (r *KalmOperatorConfigReconciler) isCertManagerReady(ctx context.Context) bool {
	// make sure cert-manager is ready
	certMgrNamespace := "cert-manager"
	dps := []string{"cert-manager", "cert-manager-cainjector", "cert-manager-webhook"}

	return r.checkIfDPReady(ctx, certMgrNamespace, dps...)
}

func (r *KalmOperatorConfigReconciler) isIstioReady(ctx context.Context) bool {
	istioNamespace := "istio-system"
	dps := []string{"istiod", "istio-ingressgateway", "prometheus"}

	return r.checkIfDPReady(ctx, istioNamespace, dps...)
}

//func (r *KalmOperatorConfigReconciler) deleteResources(config *installv1alpha1.KalmOperatorConfig, ctx context.Context, log logr.Logger) error {
//	return nil
//}

func (r *KalmOperatorConfigReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&installv1alpha1.KalmOperatorConfig{}).
		Complete(r)
}
