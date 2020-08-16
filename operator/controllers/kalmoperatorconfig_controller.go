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
	"istio.io/api/security/v1beta1"
	v1beta13 "istio.io/api/type/v1beta1"
	v1beta12 "istio.io/client-go/pkg/apis/security/v1beta1"
	appsV1 "k8s.io/api/apps/v1"
	v1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	apiextv1beta1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1beta1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/serializer"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
	"sigs.k8s.io/controller-runtime/pkg/source"
	"strconv"
	"time"
)

const (
	NamespaceKalmSystem   = "kalm-system"
	KalmDashboardImgRepo  = "kalmhq/kalm"
	KalmControllerImgRepo = "kalmhq/kalm-controller"
	FallbackImgVersion    = "latest"
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
		r.Log.Info("Dependency not ready, retry after 5 seconds")
		return ctrl.Result{RequeueAfter: 5 * time.Second}, nil
	}

	return ctrl.Result{}, err
}

func (r *KalmOperatorConfigReconciler) applyFromYaml(ctx context.Context, yamlName string) error {
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
			r.Log.Error(err, fmt.Sprintf("Get Object Key from object error"))
			return err
		}

		apiVersion, kind := object.GetObjectKind().GroupVersionKind().ToAPIVersionAndKind()
		fetchedObj, err := r.Scheme.New(object.GetObjectKind().GroupVersionKind())

		if err != nil {
			r.Log.Error(err, fmt.Sprintf("New object error, apiVersion: %s, kind: %s", apiVersion, kind))
			return err
		}

		if err := r.Client.Get(ctx, objectKey, fetchedObj); err != nil {
			if errors.IsNotFound(err) {
				err = r.Client.Create(ctx, object)

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

		if err := r.Client.Patch(ctx, object, client.Merge); err != nil {
			r.Log.Error(err, fmt.Sprintf("Apply object failed. %v", objectKey))
			return err
		}

		r.Log.Info(fmt.Sprintf("Patch object %s", objectKey.String()))
	}

	return nil
}

var retryLaterErr = fmt.Errorf("retry later")

const istioPromRecordingRulesFileName = "istio-prom-recording-rules.yaml"

func (r *KalmOperatorConfigReconciler) reconcileResources(config *installv1alpha1.KalmOperatorConfig, ctx context.Context, log logr.Logger) error {
	// TODO delete when skip
	if !config.Spec.SkipCertManagerInstallation {
		//r.Log.Info("installing cert-manager")

		if err := r.applyFromYaml(ctx, "cert-manager.yaml"); err != nil {
			log.Error(err, "install certManager error.")
			return err
		}
	}

	if !config.Spec.SkipIstioInstallation {
		//r.Log.Info("installing istio")

		if err := r.applyFromYaml(ctx, "istio.yaml"); err != nil {
			log.Error(err, "install istio error.")
			return err
		}

		if err := r.applyFromYaml(ctx, "istiocontrolplane.yaml"); err != nil {
			log.Error(err, "install istio plane error.")
			return err
		}

		if err := r.AddRecordingRulesForIstioPrometheus(ctx); err != nil {
			log.Error(err, "add recording rules form istio prometheus failed.")
			return err
		}
	}

	// TODO kalm need some specific CRD to be installed. Not some deployment to be running. Should we change the checks below?
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
		if err := r.applyFromYaml(ctx, "kalm.yaml"); err != nil {
			log.Error(err, "install kalm error.")
			return err
		}

		if !r.isKalmCRDReady(ctx) {
			return retryLaterErr
		}

		if err := r.reconcileKalmController(ctx, config); err != nil {
			return err
		}
	}

	if !config.Spec.SkipKalmDashboardInstallation {
		//r.Log.Info("installing kalm-dashboard")

		var dashboardVersion string
		if config.Spec.KalmVersion != "" {
			dashboardVersion = config.Spec.KalmVersion
		} else {
			dashboardVersion = FallbackImgVersion
		}

		dashboardName := "kalm"
		expectedDashboard := corev1alpha1.Component{
			ObjectMeta: ctrl.ObjectMeta{
				Namespace: NamespaceKalmSystem,
				Name:      dashboardName,
			},
			Spec: corev1alpha1.ComponentSpec{
				Image:   fmt.Sprintf("%s:%s", KalmDashboardImgRepo, dashboardVersion),
				Command: "./kalm-api-server",
				Ports: []corev1alpha1.Port{
					// Main service port
					{
						Protocol:      corev1alpha1.PortProtocolHTTP,
						ContainerPort: 3001,
						ServicePort:   80,
					},
					// Webhook service port
					{
						Protocol:      corev1alpha1.PortProtocolHTTP,
						ContainerPort: 3002,
						ServicePort:   3002,
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

		// Create policy, only allow traffic from istio-ingressgateway to reach kalm api/dashboard
		policy := &v1beta12.AuthorizationPolicy{
			ObjectMeta: metaV1.ObjectMeta{
				Namespace: NamespaceKalmSystem,
				Name:      dashboardName,
			},
			Spec: v1beta1.AuthorizationPolicy{
				Selector: &v1beta13.WorkloadSelector{
					MatchLabels: map[string]string{
						"app": dashboardName,
					},
				},
				Action: v1beta1.AuthorizationPolicy_ALLOW,
				Rules: []*v1beta1.Rule{
					{
						When: []*v1beta1.Condition{
							{
								Key: "source.namespace",
								Values: []string{
									"istio-system",
								},
							},
						},
					},
				},
			},
		}

		var fetchedPolicy v1beta12.AuthorizationPolicy
		err = r.Get(ctx, types.NamespacedName{Name: policy.Name, Namespace: policy.Namespace}, &fetchedPolicy)
		if err != nil {
			if !errors.IsNotFound(err) {
				return err
			}

			if err := r.Client.Create(ctx, policy); err != nil {
				return err
			}
		} else {
			dashboard.Spec = expectedDashboard.Spec
			copied := fetchedPolicy.DeepCopy()
			copied.Spec = policy.Spec

			if err := r.Client.Patch(ctx, copied, client.MergeFrom(&fetchedPolicy)); err != nil {
				return err
			}
		}
	}

	return nil
}

func (r *KalmOperatorConfigReconciler) checkIfCRDReady(ctx context.Context, crdNameOpt []string) bool {
	for _, crdName := range crdNameOpt {
		var crd apiextv1beta1.CustomResourceDefinition
		err := r.Get(ctx, client.ObjectKey{Name: crdName}, &crd)
		if err != nil {
			r.Log.Info("CRD not ready", "crd", crdName, "err", err)
			return false
		}
	}

	return true
}

func (r *KalmOperatorConfigReconciler) isKalmCRDReady(ctx context.Context) bool {
	crds := []string{
		"componentpluginbindings.core.kalm.dev",
		"componentplugins.core.kalm.dev",
		"components.core.kalm.dev",
		"deploykeys.core.kalm.dev",
		"dockerregistries.core.kalm.dev",
		"httproutes.core.kalm.dev",
		"httpscertissuers.core.kalm.dev",
		"httpscerts.core.kalm.dev",
		"kalmoperatorconfigs.install.kalm.dev",
		"protectedendpoints.core.kalm.dev",
		"singlesignonconfigs.core.kalm.dev",
	}

	return r.checkIfCRDReady(ctx, crds)
}

func (r *KalmOperatorConfigReconciler) AddRecordingRulesForIstioPrometheus(ctx context.Context) error {
	cmPrometheus := corev1.ConfigMap{}
	err := r.Get(ctx, types.NamespacedName{Name: "prometheus", Namespace: "istio-system"}, &cmPrometheus)

	if err != nil {
		if !errors.IsNotFound(err) {
			return err
		}

		// Not found. It should be created later by istio-operator
		// Skip for now.
		return nil
	}

	dpPromethues := v1.Deployment{}
	err = r.Get(ctx, types.NamespacedName{Name: "prometheus", Namespace: "istio-system"}, &dpPromethues)
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

	// TODO is this part ok if it executes more than once? @mingmin
	if len(pConfig.RuleFiles) <= 0 {
		pConfig.RuleFiles = []string{istioPromRecordingRulesFileName}

		cmPrometheus.Data["prometheus.yml"] = pConfig.String()
		cmPrometheus.Data[istioPromRecordingRulesFileName] = string(MustAsset("istio-prom-recording-rules.yaml"))

		if err := r.Update(ctx, &cmPrometheus); err != nil {
			return err
		}

		// trigger update
		dpPrometheusCopy := dpPromethues.DeepCopy()
		dpPrometheusCopy.Spec.Template.ObjectMeta.Labels["date"] = strconv.Itoa(int(time.Now().Unix()))

		err = r.Patch(ctx, dpPrometheusCopy, client.MergeFrom(&dpPromethues))

		if err != nil {
			return err
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

type KalmIstioPrometheusWather struct {
}

func (r *KalmIstioPrometheusWather) Map(obj handler.MapObject) []reconcile.Request {
	if obj.Meta.GetNamespace() != "istio-system" || obj.Meta.GetName() != "prometheus" {
		return nil
	}

	return []reconcile.Request{{NamespacedName: types.NamespacedName{Namespace: "kalm-operator", Name: "reconcile-caused-by-prometheus-config"}}}
}

func (r *KalmOperatorConfigReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&installv1alpha1.KalmOperatorConfig{}).
		Watches(&source.Kind{Type: &corev1.ConfigMap{}}, &handler.EnqueueRequestsFromMapFunc{
			ToRequests: &KalmIstioPrometheusWather{},
		}).
		Watches(&source.Kind{Type: &v1.Deployment{}}, &handler.EnqueueRequestsFromMapFunc{
			ToRequests: &KalmIstioPrometheusWather{},
		}).
		Complete(r)
}

func (r *KalmOperatorConfigReconciler) reconcileKalmController(ctx context.Context, config *installv1alpha1.KalmOperatorConfig) error {
	// ensure existence of ns: NamespaceKalmSystem
	expectedNs := corev1.Namespace{
		ObjectMeta: ctrl.ObjectMeta{
			Name: NamespaceKalmSystem,
			Labels: map[string]string{
				"control-plane":   "controller",
				"kalm-enabled":    "true",
				"istio-injection": "enabled",
			},
		},
	}

	ns := corev1.Namespace{}
	nsIsNew := false

	err := r.Get(ctx, client.ObjectKey{Name: NamespaceKalmSystem}, &ns)
	if err != nil {
		if errors.IsNotFound(err) {
			nsIsNew = true
		} else {
			return err
		}
	}

	if nsIsNew {
		ns = expectedNs
		if err := r.Create(ctx, &ns); err != nil {
			return err
		}
	} else {
		copiedNS := ns.DeepCopy()
		if copiedNS.Labels == nil {
			copiedNS.Labels = make(map[string]string)
		}

		for k, v := range expectedNs.Labels {
			copiedNS.Labels[k] = v
		}

		if err := r.Update(ctx, copiedNS); err != nil {
			return err
		}
	}

	// reconcile deployment: controller
	replica := int32(1)
	terminationGracePeriodSeconds := int64(10)
	secVolSourceDefaultMode := int32(420)

	var controllerImgTag string
	if config.Spec.KalmVersion != "" {
		controllerImgTag = config.Spec.KalmVersion
	} else {
		controllerImgTag = FallbackImgVersion
	}

	img := fmt.Sprintf("%s:%s", KalmControllerImgRepo, controllerImgTag)

	dpName := "kalm-controller"
	expectedKalmController := appsV1.Deployment{
		ObjectMeta: ctrl.ObjectMeta{
			Namespace: NamespaceKalmSystem,
			Name:      dpName,
			Labels: map[string]string{
				"control-plane": "controller",
			},
		},
		Spec: v1.DeploymentSpec{
			Selector: &metaV1.LabelSelector{
				MatchLabels: map[string]string{
					"control-plane": "controller",
				},
			},
			Replicas: &replica,
			Template: corev1.PodTemplateSpec{
				ObjectMeta: ctrl.ObjectMeta{
					Labels: map[string]string{
						"control-plane":                "controller",
						"sidecar.istio.io/proxyCPU":    "10m",
						"sidecar.istio.io/proxyMemory": "50m",
					},
				},
				Spec: corev1.PodSpec{
					ImagePullSecrets: []corev1.LocalObjectReference{
						{Name: "docker-registry-secret"},
					},
					Containers: []corev1.Container{
						{
							Name:  "kube-rbac-proxy",
							Image: "gcr.io/kubebuilder/kube-rbac-proxy:v0.4.1",
							Ports: []corev1.ContainerPort{
								{ContainerPort: 8443, Name: "https"},
							},
							Args: []string{
								"--secure-listen-address=0.0.0.0:8443",
								"--upstream=http://127.0.0.1:8080/",
								"--logtostderr=true",
								"--v=10",
							},
						},
						{
							Command: []string{"/manager"},
							Args: []string{
								"--enable-leader-election",
								"--metrics-addr=127.0.0.1:8080",
							},
							Image:           img,
							ImagePullPolicy: "Always",
							Name:            "manager",
							Env: []corev1.EnvVar{
								{Name: "ENABLE_WEBHOOKS", Value: "true"},
								{Name: "KALM_VERSION", Value: controllerImgTag},
							},
							Ports: []corev1.ContainerPort{
								{
									Name:          "webhook-server",
									ContainerPort: 9443,
									Protocol:      "TCP",
								},
							},
							Resources: corev1.ResourceRequirements{
								Limits: map[corev1.ResourceName]resource.Quantity{
									corev1.ResourceCPU:    resource.MustParse("100m"),
									corev1.ResourceMemory: resource.MustParse("256Mi"),
								},
								Requests: map[corev1.ResourceName]resource.Quantity{
									corev1.ResourceCPU:    resource.MustParse("10m"),
									corev1.ResourceMemory: resource.MustParse("128Mi"),
								},
							},
							VolumeMounts: []corev1.VolumeMount{
								{
									Name:      "cert",
									MountPath: "/tmp/k8s-webhook-server/serving-certs",
									ReadOnly:  true,
								},
							},
						},
					},
					TerminationGracePeriodSeconds: &terminationGracePeriodSeconds,
					Volumes: []corev1.Volume{
						{
							Name: "cert",
							VolumeSource: corev1.VolumeSource{
								Secret: &corev1.SecretVolumeSource{
									DefaultMode: &secVolSourceDefaultMode,
									SecretName:  "webhook-server-cert",
								},
							},
						},
					},
				},
			},
		},
	}

	var dp appsV1.Deployment
	var isNew bool

	err = r.Get(ctx, client.ObjectKey{Namespace: NamespaceKalmSystem, Name: dpName}, &dp)
	if err != nil {
		if errors.IsNotFound(err) {
			isNew = true
		} else {
			return err
		}
	}

	if isNew {
		dp = expectedKalmController
		err = r.Create(ctx, &dp)
	} else {
		copiedDP := dp.DeepCopy()
		copiedDP.Spec = expectedKalmController.Spec

		err = r.Update(ctx, copiedDP)
	}

	return err
}
