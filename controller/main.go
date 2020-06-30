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

	istioScheme "istio.io/client-go/pkg/clientset/versioned/scheme"

	monitoringv1 "github.com/coreos/prometheus-operator/pkg/apis/monitoring/v1"
	elkv1 "github.com/elastic/cloud-on-k8s/pkg/apis/elasticsearch/v1"
	kibanav1 "github.com/elastic/cloud-on-k8s/pkg/apis/kibana/v1"

	apiextv1beta1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1beta1"
	"k8s.io/apimachinery/pkg/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	_ "k8s.io/client-go/plugin/pkg/client/auth/gcp"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"

	corev1alpha1 "github.com/kapp-staging/kapp/controller/api/v1alpha1"
	"github.com/kapp-staging/kapp/controller/controllers"

	cmv1alpha2 "github.com/jetstack/cert-manager/pkg/apis/certmanager/v1alpha2"
	apiregistration "k8s.io/kube-aggregator/pkg/apis/apiregistration/v1"
	//corekappdevv1alpha1 "github.com/kapp-staging/kapp/controller/api/v1alpha1"
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

	apiregistration.AddToScheme(scheme)

	elkv1.AddToScheme(scheme)
	kibanav1.AddToScheme(scheme)
	istioScheme.AddToScheme(scheme)

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
		Scheme:             scheme,
		MetricsBindAddress: metricsAddr,
		LeaderElection:     enableLeaderElection,
		Port:               9443,
	})
	if err != nil {
		setupLog.Error(err, "unable to start manager")
		os.Exit(1)
	}

	//if err = controllers.NewApplicationReconciler(mgr).SetupWithManager(mgr); err != nil {
	//	setupLog.Error(err, "unable to create controller", "controller", "Application")
	//	os.Exit(1)
	//}

	if err = (controllers.NewKappNSReconciler(mgr)).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "KappNS")
		os.Exit(1)
	}

	//if err = (&controllers.KappNamespacesReconciler{
	//	BaseReconciler: &controllers.BaseReconciler{
	//		Client: mgr.GetClient(),
	//		Log:    ctrl.Log.WithName("controllers").WithName("KappNamespace"),
	//		Scheme: mgr.GetScheme(),
	//	},
	//}).SetupWithManager(mgr); err != nil {
	//	setupLog.Error(err, "unable to create controller", "controller", "KappNamespaces")
	//	os.Exit(1)
	//}

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

	if err = (controllers.NewKappPVCReconciler(mgr)).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "KappPVC")
		os.Exit(1)
	}

	//(controllers.NewComponentAdmissionWebhook()).SetupWithManager(mgr)
	if err = (&corev1alpha1.Component{}).SetupWebhookWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create webhook", "webhook", "Component")
		os.Exit(1)
	}
	// +kubebuilder:scaffold:builder

	// only run webhook if explicitly declared
	//if os.Getenv("ENABLE_WEBHOOKS") == "true" {
	//	if err = (&corekappdevv1alpha1.Application{}).SetupWebhookWithManager(mgr); err != nil {
	//		setupLog.Error(err, "unable to create webhook", "webhook", "Application")
	//		os.Exit(1)
	//	}
	//	setupLog.Info("WEBHOOK enabled")
	//} else {
	//	setupLog.Info("WEBHOOK not enabled")
	//}

	setupLog.Info("starting manager")
	if err := mgr.Start(ctrl.SetupSignalHandler()); err != nil {
		setupLog.Error(err, "problem running manager")
		os.Exit(1)
	}
}
