package controllers

import (
	"fmt"
	"strings"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	installv1alpha1 "github.com/kalmhq/kalm/operator/api/v1alpha1"
	"istio.io/pkg/log"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (r *KalmOperatorConfigReconciler) reconcileKalmController() error {
	configSpec := r.config.Spec

	if err := r.applyFromYaml("kalm.yaml"); err != nil {
		log.Error(err, "install kalm error.")
		return err
	}

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

	err := r.Get(r.Ctx, client.ObjectKey{Name: NamespaceKalmSystem}, &ns)
	if err != nil {
		if errors.IsNotFound(err) {
			nsIsNew = true
		} else {
			return err
		}
	}

	if nsIsNew {
		ns = expectedNs
		if err := r.Create(r.Ctx, &ns); err != nil {
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

		if err := r.Update(r.Ctx, copiedNS); err != nil {
			return err
		}
	}

	// reconcile deployment: controller
	replica := int32(1)
	terminationGracePeriodSeconds := int64(10)
	secVolSourceDefaultMode := int32(420)

	controllerImgTag := getKalmControllerVersion(configSpec)
	img := fmt.Sprintf("%s:%s", KalmControllerImgRepo, controllerImgTag)

	envVars := getEnvVarsForController(configSpec)

	dpName := "kalm-controller"
	expectedKalmController := appsv1.Deployment{
		ObjectMeta: ctrl.ObjectMeta{
			Namespace: NamespaceKalmSystem,
			Name:      dpName,
			Labels: map[string]string{
				"control-plane": "controller",
			},
		},
		Spec: appsv1.DeploymentSpec{
			Selector: &metav1.LabelSelector{
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
							Env:             envVars,
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

	var dp appsv1.Deployment
	var isNew bool

	err = r.Get(r.Ctx, client.ObjectKey{Namespace: NamespaceKalmSystem, Name: dpName}, &dp)
	if err != nil {
		if errors.IsNotFound(err) {
			isNew = true
		} else {
			return err
		}
	}

	if isNew {
		dp = expectedKalmController
		err = r.Create(r.Ctx, &dp)
	} else {
		copiedDP := dp.DeepCopy()
		copiedDP.Spec = expectedKalmController.Spec

		err = r.Update(r.Ctx, copiedDP)
	}

	return err
}

func getEnvVarsForController(configSpec installv1alpha1.KalmOperatorConfigSpec) []corev1.EnvVar {
	controllerImgTag := getKalmControllerVersion(configSpec)
	authProxyVersion := getKalmAuthProxyVersion(configSpec)

	var envUseLetsencryptProductionAPI string
	var extDNSServerIP string

	controllerConfig := configSpec.Controller
	if controllerConfig != nil {
		if controllerConfig.UseLetsEncryptProductionAPI {
			envUseLetsencryptProductionAPI = "true"
		} else {
			envUseLetsencryptProductionAPI = "false"
		}

		extDNSServerIP = controllerConfig.ExternalDNSServerIP
	}

	kalmMode := DecideKalmMode(configSpec)
	physicalClusterID := configSpec.PhysicalClusterID

	var cloudflareDomainToZoneConfigStr string
	var cloudflareToken string

	var cloudflareConfig *installv1alpha1.CloudflareConfig
	if configSpec.LocalModeConfig != nil {
		cloudflareConfig = configSpec.LocalModeConfig.CloudflareConfig
	}

	if cloudflareConfig != nil {
		cloudflareDomainToZoneConfigStr = getCloudflareDomainToZoneConfigStr(cloudflareConfig)
		cloudflareToken = cloudflareConfig.APIToken
	}

	var baseAppDomain string
	var baseDNSDomain string

	if configSpec.BYOCModeConfig != nil {
		baseAppDomain = configSpec.BYOCModeConfig.BaseAppDomain
		baseDNSDomain = configSpec.BYOCModeConfig.BaseDNSDomain
	}

	envVars := []corev1.EnvVar{
		{Name: "ENABLE_WEBHOOKS", Value: "true"},
		{Name: "KALM_VERSION", Value: controllerImgTag},
		{Name: "KALM_AUTH_PROXY_VERSION", Value: authProxyVersion},
		{Name: v1alpha1.ENV_USE_LETSENCRYPT_PRODUCTION_API, Value: envUseLetsencryptProductionAPI},
		{Name: v1alpha1.ENV_KALM_MODE, Value: string(kalmMode)},
		{Name: v1alpha1.ENV_KALM_PHYSICAL_CLUSTER_ID, Value: physicalClusterID},
		{Name: v1alpha1.ENV_KALM_BASE_APP_DOMAIN, Value: baseAppDomain},
		{Name: v1alpha1.ENV_KALM_BASE_DNS_DOMAIN, Value: baseDNSDomain},
		{Name: v1alpha1.ENV_CLOUDFLARE_TOKEN, Value: cloudflareToken},
		{Name: v1alpha1.ENV_CLOUDFLARE_DOMAIN_TO_ZONEID_CONFIG, Value: cloudflareDomainToZoneConfigStr},
		{Name: v1alpha1.ENV_EXTERNAL_DNS_SERVER_IP, Value: extDNSServerIP},
	}

	return envVars
}

func getCloudflareDomainToZoneConfigStr(cloudflareConfig *installv1alpha1.CloudflareConfig) string {
	var cloudflareDomainToZoneConfig map[string]string

	if cloudflareConfig != nil {
		cloudflareDomainToZoneConfig = cloudflareConfig.DomainToZoneIDConfig
	}

	var configs []string
	for domain, zone := range cloudflareDomainToZoneConfig {
		configs = append(configs, fmt.Sprintf("%s:%s", domain, zone))
	}
	configStr := strings.Join(configs, ";")

	return configStr
}

func getControllerArgs() []string {
	args := []string{
		"--enable-leader-election",
		"--metrics-addr=127.0.0.1:8080",
	}

	return args
}

func getKalmControllerVersion(configSpec installv1alpha1.KalmOperatorConfigSpec) string {
	c := configSpec.Controller
	if c != nil {
		if c.Version != nil && *c.Version != "" {
			return *c.Version
		}
	}

	if configSpec.Version != "" {
		return configSpec.Version
	}

	if configSpec.KalmVersion != "" {
		return configSpec.KalmVersion
	}

	return "latest"
}

func getKalmAuthProxyVersion(configSpec installv1alpha1.KalmOperatorConfigSpec) string {
	return getKalmDashboardVersion(configSpec)
}
