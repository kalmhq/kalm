package controllers

import (
	"context"
	"fmt"
	"strconv"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	installv1alpha1 "github.com/kalmhq/kalm/operator/api/v1alpha1"
	appsV1 "k8s.io/api/apps/v1"
	v1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (r *KalmOperatorConfigReconciler) reconcileKalmController(ctx context.Context, config *installv1alpha1.KalmOperatorConfig) error {
	// ensure existence of ns: NamespaceKalmSystem
	expectedNs := corev1.Namespace{
		ObjectMeta: ctrl.ObjectMeta{
			Name: NamespaceKalmSystem,
			Labels: map[string]string{
				"control-plane":      "controller",
				"kalm-enabled":       "true",
				"istio-injection":    "enabled",
				"kalm-control-plane": "true",
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

	controllerImgTag := getKalmControllerVersion(config)
	img := fmt.Sprintf("%s:%s", KalmControllerImgRepo, controllerImgTag)

	authProxyVersion := getKalmAuthProxyVersion(config)

	var envUseLetsencryptProductionAPI string
	if config.Spec.Controller != nil && config.Spec.Controller.UseLetsEncryptProductionAPI {
		envUseLetsencryptProductionAPI = "true"
	} else {
		envUseLetsencryptProductionAPI = "false"
	}

	isLocalMode := strconv.FormatBool(config.Spec.KalmType == "local")

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
							Command:         []string{"/manager"},
							Args:            getControllerArgs(),
							Image:           img,
							ImagePullPolicy: "Always",
							Name:            "manager",
							Env: []corev1.EnvVar{
								{Name: "ENABLE_WEBHOOKS", Value: "true"},
								{Name: "KALM_VERSION", Value: controllerImgTag},
								{Name: "KALM_AUTH_PROXY_VERSION", Value: authProxyVersion},
								{Name: v1alpha1.ENV_USE_LETSENCRYPT_PRODUCTION_API, Value: envUseLetsencryptProductionAPI},
								{Name: v1alpha1.ENV_KALM_IS_IN_LOCAL_MODE, Value: isLocalMode},
								{Name: v1alpha1.ENV_KALM_CLUSTER_BASE_DOMAIN, Value: config.Spec.ClusterBaseDomain},
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

func getControllerArgs() []string {
	args := []string{
		"--enable-leader-election",
		"--metrics-addr=127.0.0.1:8080",
	}

	return args
}

func getKalmControllerVersion(config *installv1alpha1.KalmOperatorConfig) string {
	c := config.Spec.Controller
	if c != nil {
		if c.Version != nil && *c.Version != "" {
			return *c.Version
		}
	}

	if config.Spec.Version != "" {
		return config.Spec.Version
	}

	if config.Spec.KalmVersion != "" {
		return config.Spec.KalmVersion
	}

	return "latest"
}

func getKalmAuthProxyVersion(config *installv1alpha1.KalmOperatorConfig) string {
	return getKalmDashboardVersion(config)
}
