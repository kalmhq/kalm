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

package main

import (
	"flag"
	"os"

	monitoringv1 "github.com/coreos/prometheus-operator/pkg/apis/monitoring/v1"
	elkv1 "github.com/elastic/cloud-on-k8s/pkg/apis/elasticsearch/v1"
	kibanav1 "github.com/elastic/cloud-on-k8s/pkg/apis/kibana/v1"
	_ "github.com/joho/godotenv/autoload"
	istioScheme "istio.io/client-go/pkg/clientset/versioned/scheme"

	apiextv1beta1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1beta1"
	"k8s.io/apimachinery/pkg/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	_ "k8s.io/client-go/plugin/pkg/client/auth/gcp"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"

	corev1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/kalmhq/kalm/controller/controllers"

	cmv1alpha2 "github.com/jetstack/cert-manager/pkg/apis/certmanager/v1alpha2"
	apiregistration "k8s.io/kube-aggregator/pkg/apis/apiregistration/v1"
	// +kubebuilder:scaffold:imports
)

var (
	scheme   = runtime.NewScheme()
	setupLog = ctrl.Log.WithName("setup")
)

func init() {
	_ = clientgoscheme.AddToScheme(scheme)

	_ = corev1alpha1.AddToScheme(scheme)

	_ = cmv1alpha2.AddToScheme(scheme)

	err := apiextv1beta1.AddToScheme(scheme)
	if err != nil {
		panic(err)
	}

	err = monitoringv1.AddToScheme(scheme)
	if err != nil {
		panic(err)
	}

	_ = apiregistration.AddToScheme(scheme)

	_ = elkv1.AddToScheme(scheme)
	_ = kibanav1.AddToScheme(scheme)
	_ = istioScheme.AddToScheme(scheme)

	// +kubebuilder:scaffold:scheme
}

func main() {
	var metricsAddr string
	var enableLeaderElection bool

	flag.StringVar(&metricsAddr, "metrics-addr", ":8080", "The address the metric endpoint binds to.")
	flag.BoolVar(&enableLeaderElection, "enable-leader-election", false,
		"Enable leader election for controller manager. Enabling this will ensure there is only one active controller manager.")
	flag.Parse()

	ctrl.SetLogger(zap.New(func(o *zap.Options) {
		o.Development = true
	}))

	mgr, err := ctrl.NewManager(ctrl.GetConfigOrDie(), ctrl.Options{
		Scheme:                  scheme,
		MetricsBindAddress:      metricsAddr,
		LeaderElection:          enableLeaderElection,
		LeaderElectionID:        "kalm-controller",
		LeaderElectionNamespace: "kalm-system",
		Port:                    9443,
		CertDir:                 os.Getenv("WEBHOOKS_CERTS_DIR"),
	})

	if err != nil {
		setupLog.Error(err, "unable to start manager")
		os.Exit(1)
	}

	if err = (controllers.NewKalmNSReconciler(mgr)).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "KalmNS")
		os.Exit(1)
	}

	if err = controllers.NewComponentPluginReconciler(mgr).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "ComponentPlugin")
		os.Exit(1)
	}

	if err = controllers.NewComponentReconciler(mgr).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "Component")
		os.Exit(1)
	}

	if err = controllers.NewComponentPluginBindingReconciler(mgr).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "ComponentPluginBinding")
		os.Exit(1)
	}

	if err = controllers.NewHttpsCertIssuerReconciler(mgr).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "HttpsCertIssuer")
		os.Exit(1)
	}
	if err = controllers.NewHttpsCertReconciler(mgr).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "HttpsCert")
		os.Exit(1)
	}

	if err = controllers.NewDockerRegistryReconciler(mgr).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "DockerRegistry")
		os.Exit(1)
	}

	if err = controllers.NewHttpRouteReconciler(mgr).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "HttpRoute")
		os.Exit(1)
	}

	if err = controllers.NewGatewayReconciler(mgr).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "Gateway")
		os.Exit(1)
	}

	if err = (controllers.NewKalmPVCReconciler(mgr)).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "KalmPVC")
		os.Exit(1)
	}

	if err = (controllers.NewKalmPVReconciler(mgr)).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "KalmPV")
		os.Exit(1)
	}

	if err = (controllers.NewSingleSignOnConfigReconciler(mgr)).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "SingleSignOnConfig")
		os.Exit(1)
	}

	if err = (controllers.NewProtectedEndpointReconciler(mgr)).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "ProtectedEndpoint")
		os.Exit(1)
	}

	if err = (controllers.NewStorageClassReconciler(mgr)).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "StorageClass")
		os.Exit(1)
	}

	if err = (controllers.NewACMEServerReconciler(mgr)).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "ACMEServer")
		os.Exit(1)
	}

	if err = (controllers.NewLogSystemReconciler(mgr)).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "LogSystem")
		os.Exit(1)
	}

	if err = controllers.NewDomainReconciler(mgr).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller: Domain")
		os.Exit(1)
	}

	if err = controllers.NewDNSRecordReconciler(mgr).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller: DNSRecord")
		os.Exit(1)
	}

	// only run webhook if explicitly declared
	if os.Getenv("ENABLE_WEBHOOKS") == "true" {

		if err = (&corev1alpha1.AccessToken{}).SetupWebhookWithManager(mgr); err != nil {
			setupLog.Error(err, "unable to create webhook", "webhook", "AccessToken")
			os.Exit(1)
		}

		if err = (&corev1alpha1.RoleBinding{}).SetupWebhookWithManager(mgr); err != nil {
			setupLog.Error(err, "unable to create webhook", "webhook", "RoleBinding")
			os.Exit(1)
		}

		if err = (&corev1alpha1.Component{}).SetupWebhookWithManager(mgr); err != nil {
			setupLog.Error(err, "unable to create webhook", "webhook", "Component")
			os.Exit(1)
		}

		if err = (&corev1alpha1.ComponentPluginBinding{}).SetupWebhookWithManager(mgr); err != nil {
			setupLog.Error(err, "unable to create webhook", "webhook", "ComponentPluginBinding")
			os.Exit(1)
		}

		if err = (&corev1alpha1.DockerRegistry{}).SetupWebhookWithManager(mgr); err != nil {
			setupLog.Error(err, "unable to create webhook", "webhook", "DockerRegistry")
			os.Exit(1)
		}

		if err = (&corev1alpha1.HttpRoute{}).SetupWebhookWithManager(mgr); err != nil {
			setupLog.Error(err, "unable to create webhook", "webhook", "HttpRoute")
			os.Exit(1)
		}

		if err = (&corev1alpha1.HttpsCert{}).SetupWebhookWithManager(mgr); err != nil {
			setupLog.Error(err, "unable to create webhook", "webhook", "HttpsCert")
			os.Exit(1)
		}

		if err = (&corev1alpha1.HttpsCertIssuer{}).SetupWebhookWithManager(mgr); err != nil {
			setupLog.Error(err, "unable to create webhook", "webhook", "HttpsCertIssuer")
			os.Exit(1)
		}

		if err = (&corev1alpha1.ProtectedEndpoint{}).SetupWebhookWithManager(mgr); err != nil {
			setupLog.Error(err, "unable to create webhook", "webhook", "ProtectedEndpoint")
			os.Exit(1)
		}

		if err = (&corev1alpha1.SingleSignOnConfig{}).SetupWebhookWithManager(mgr); err != nil {
			setupLog.Error(err, "unable to create webhook", "webhook", "SingleSignOnConfig")
			os.Exit(1)
		}

		if err = (&corev1alpha1.LogSystem{}).SetupWebhookWithManager(mgr); err != nil {
			setupLog.Error(err, "unable to create webhook", "webhook", "LogSystem")
			os.Exit(1)
		}

		if err = (&corev1alpha1.ACMEServer{}).SetupWebhookWithManager(mgr); err != nil {
			setupLog.Error(err, "unable to create webhook", "webhook", "ACMEServer")
			os.Exit(1)
		}

		if err = (&corev1alpha1.Domain{}).SetupWebhookWithManager(mgr); err != nil {
			setupLog.Error(err, "unable to create webhook", "webhook", "Domain")
			os.Exit(1)
		}

		setupLog.Info("WEBHOOK enabled")
	} else {
		setupLog.Info("WEBHOOK not enabled")
	}
	//+kubebuilder:scaffold:builder

	stopCh := ctrl.SetupSignalHandler()

	setupLog.Info("starting manager")
	if err := mgr.Start(stopCh); err != nil {
		setupLog.Error(err, "problem running manager")
		os.Exit(1)
	}
}
