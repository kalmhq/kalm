package controllers

import (
	"context"
	"fmt"
	v1alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
	"github.com/onsi/ginkgo"
	"github.com/stretchr/testify/suite"
	istioScheme "istio.io/client-go/pkg/clientset/versioned/scheme"

	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
	"math/rand"
	"path/filepath"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/envtest"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"
	"time"
)

func init() {
	rand.Seed(time.Now().UnixNano())
}

type BasicSuite struct {
	suite.Suite

	Cfg            *rest.Config
	K8sClient      client.Client
	TestEnv        *envtest.Environment
	MgrStopChannel chan struct{}
}

func (suite *BasicSuite) Eventually(condition func() bool, msgAndArgs ...interface{}) bool {
	waitFor := time.Second * 20
	tick := time.Millisecond * 500
	return suite.Suite.Eventually(condition, waitFor, tick, msgAndArgs...)
}

func (suite *BasicSuite) createComponentPlugin(plugin *v1alpha1.ComponentPlugin) {
	suite.Nil(suite.K8sClient.Create(context.Background(), plugin))

	// after the finalizer is set, the plugin won't auto change
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), getComponentPluginNamespacedName(plugin), plugin)

		if err != nil {
			return false
		}

		for i := range plugin.Finalizers {
			if plugin.Finalizers[i] == finalizerName {
				return true
			}
		}

		return false
	})
}

func (suite *BasicSuite) createApplicationPlugin(plugin *v1alpha1.ApplicationPlugin) {
	suite.Nil(suite.K8sClient.Create(context.Background(), plugin))

	// after the finalizer is set, the plugin won't auto change
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), getApplicationPluginNamespacedName(plugin), plugin)

		if err != nil {
			return false
		}

		for i := range plugin.Finalizers {
			if plugin.Finalizers[i] == finalizerName {
				return true
			}
		}

		return false
	})
}

func (suite *BasicSuite) createApplication(application *v1alpha1.Application) {
	suite.Nil(suite.K8sClient.Create(context.Background(), application))

	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), getApplicationNamespacedName(application), application)

		if err != nil {
			return false
		}

		for i := range application.Finalizers {
			if application.Finalizers[i] == finalizerName {
				return true
			}
		}

		return false
	}, "Created application has no finalizer.")
}

func (suite *BasicSuite) reloadObject(key client.ObjectKey, obj runtime.Object) {
	suite.Nil(suite.K8sClient.Get(context.Background(), key, obj))
}

func (suite *BasicSuite) updateObject(obj runtime.Object) {
	suite.Nil(suite.K8sClient.Update(context.Background(), obj))
}

func (suite *BasicSuite) createObject(obj runtime.Object) {
	suite.Nil(suite.K8sClient.Create(context.Background(), obj))
}

func (suite *BasicSuite) reloadComponent(component *v1alpha1.Component) {
	suite.reloadObject(types.NamespacedName{Name: component.Name, Namespace: component.Namespace}, component)
}

func (suite *BasicSuite) updateComponent(component *v1alpha1.Component) {
	suite.updateObject(component)
}

func (suite *BasicSuite) createComponent(component *v1alpha1.Component) {
	suite.createObject(component)
}

func (suite *BasicSuite) SetupSuite() {
	logf.SetLogger(zap.New(zap.UseDevMode(true), zap.WriteTo(ginkgo.GinkgoWriter)))

	// bootstrapping test environment
	testEnv := &envtest.Environment{
		CRDDirectoryPaths: []string{
			filepath.Join("..", "config", "crd", "bases"),
			filepath.Join("config", "crd", "bases"),
			filepath.Join("..", "resources", "istio"),
			filepath.Join("resources", "istio"),
		},
	}

	var err error
	cfg, err := testEnv.Start()
	suite.Nil(err)
	suite.NotNil(cfg)
	suite.Nil(scheme.AddToScheme(scheme.Scheme))
	suite.Nil(istioScheme.AddToScheme(scheme.Scheme))
	suite.Nil(v1alpha1.AddToScheme(scheme.Scheme))

	// +kubebuilder:scaffold:scheme

	min := 2000
	max := 8000
	port := rand.Intn(max-min) + min

	mgr, err := ctrl.NewManager(cfg, ctrl.Options{
		Scheme:             scheme.Scheme,
		MetricsBindAddress: fmt.Sprintf("localhost:%d", port),
	})

	suite.NotNil(mgr)
	suite.Nil(err)

	suite.Nil((&ApplicationReconciler{
		Client: mgr.GetClient(),
		Log:    ctrl.Log.WithName("controllers").WithName("Application"),
		Scheme: mgr.GetScheme(),
		Reader: mgr.GetAPIReader(),
	}).SetupWithManager(mgr))

	suite.Nil((&ComponentPluginReconciler{
		Client: mgr.GetClient(),
		Log:    ctrl.Log.WithName("controllers").WithName("ComponentPlugin"),
		Scheme: mgr.GetScheme(),
		Reader: mgr.GetAPIReader(),
	}).SetupWithManager(mgr))

	suite.Nil((&ApplicationPluginReconciler{
		Client: mgr.GetClient(),
		Log:    ctrl.Log.WithName("controllers").WithName("ApplicationPlugin"),
		Scheme: mgr.GetScheme(),
		Reader: mgr.GetAPIReader(),
	}).SetupWithManager(mgr))

	suite.Nil((&ComponentReconciler{
		Client: mgr.GetClient(),
		Log:    ctrl.Log.WithName("controllers").WithName("Component"),
		Scheme: mgr.GetScheme(),
		Reader: mgr.GetAPIReader(),
	}).SetupWithManager(mgr))

	suite.Nil((&ComponentPluginBindingReconciler{
		Client: mgr.GetClient(),
		Log:    ctrl.Log.WithName("controllers").WithName("ComponentPluginBinding"),
		Scheme: mgr.GetScheme(),
		Reader: mgr.GetAPIReader(),
	}).SetupWithManager(mgr))

	mgrStopChannel := make(chan struct{})

	go func() {
		err = mgr.Start(mgrStopChannel)
		suite.Nil(err)
	}()

	k8sClient := mgr.GetClient()
	suite.NotNil(k8sClient)

	suite.TestEnv = testEnv
	suite.K8sClient = k8sClient
	suite.Cfg = cfg
	suite.MgrStopChannel = mgrStopChannel
}

func (suite *BasicSuite) TearDownSuite() {
	suite.MgrStopChannel <- struct{}{}
	suite.Nil(suite.TestEnv.Stop())
}
