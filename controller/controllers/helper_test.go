package controllers

import (
	"context"
	"fmt"
	"github.com/jetstack/cert-manager/pkg/apis/certmanager/v1alpha2"
	v1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/onsi/ginkgo"
	"github.com/stretchr/testify/suite"
	istioScheme "istio.io/client-go/pkg/clientset/versioned/scheme"
	v1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"

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

func (suite *BasicSuite) Eventually(condition func() bool, msgAndArgs ...interface{}) {
	waitFor := time.Second * 20
	tick := time.Millisecond * 500
	suite.Suite.Require().Eventually(condition, waitFor, tick, msgAndArgs...)
}

func (suite *BasicSuite) True(value bool, msgAndArgs ...interface{}) {
	suite.Suite.Require().True(value, msgAndArgs...)
}

func (suite *BasicSuite) False(value bool, msgAndArgs ...interface{}) {
	suite.Suite.Require().False(value, msgAndArgs...)
}

func (suite *BasicSuite) Nil(object interface{}, msgAndArgs ...interface{}) {
	suite.Suite.Require().Nil(object, msgAndArgs...)
}

func (suite *BasicSuite) Len(object interface{}, length int, msgAndArgs ...interface{}) {
	suite.Suite.Require().Len(object, length, msgAndArgs...)
}

func (suite *BasicSuite) Equal(expected interface{}, actual interface{}, msgAndArgs ...interface{}) {
	suite.Suite.Require().Equal(expected, actual, msgAndArgs...)
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

//func (suite *BasicSuite) createApplicationPlugin(plugin *v1alpha1.ApplicationPlugin) {
//	suite.Nil(suite.K8sClient.Create(context.Background(), plugin))
//
//	// after the finalizer is set, the plugin won't auto change
//	suite.Eventually(func() bool {
//		err := suite.K8sClient.Get(context.Background(), getApplicationPluginNamespacedName(plugin), plugin)
//
//		if err != nil {
//			return false
//		}
//
//		for i := range plugin.Finalizers {
//			if plugin.Finalizers[i] == finalizerName {
//				return true
//			}
//		}
//
//		return false
//	})
//}

//func (suite *BasicSuite) createApplication(ns *v1alpha1.Application) {
//	suite.Nil(suite.K8sClient.Create(context.Background(), ns))
//
//	suite.Eventually(func() bool {
//		err := suite.K8sClient.Get(context.Background(), getApplicationNamespacedName(ns), ns)
//
//		if err != nil {
//			return false
//		}
//
//		for i := range ns.Finalizers {
//			if ns.Finalizers[i] == finalizerName {
//				return true
//			}
//		}
//
//		return false
//	}, "Created ns has no finalizer.")
//}

func getDockerRegistryNamespacedName(registry *v1alpha1.DockerRegistry) types.NamespacedName {
	return types.NamespacedName{Name: registry.Name, Namespace: registry.Namespace}
}

func (suite *BasicSuite) createDockerRegistry(registry *v1alpha1.DockerRegistry) {
	suite.Nil(suite.K8sClient.Create(context.Background(), registry))

	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), getDockerRegistryNamespacedName(registry), registry)

		if err != nil {
			return false
		}

		for i := range registry.Finalizers {
			if registry.Finalizers[i] == finalizerName {
				return true
			}
		}

		return false
	}, "Created Docker registry has no finalizer.")
}

func (suite *HttpsCertIssuerControllerSuite) createHttpsCertIssuer(issuer v1alpha1.HttpsCertIssuer) {
	suite.Nil(suite.K8sClient.Create(context.Background(), &issuer))
}

func (suite *BasicSuite) reloadObject(key client.ObjectKey, obj runtime.Object) {
	suite.Nil(suite.K8sClient.Get(context.Background(), key, obj))
}

type singleObject interface {
	runtime.Object
	GetName() string
	GetNamespace() string
}

func (suite *BasicSuite) reloadSingleObject(obj singleObject) {
	suite.Nil(suite.K8sClient.Get(context.Background(), types.NamespacedName{
		Name:      obj.GetName(),
		Namespace: obj.GetNamespace(),
	}, obj))
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
			filepath.Join("resources"),
			filepath.Join("..", "resources"),
		},
	}

	var err error
	cfg, err := testEnv.Start()
	suite.Nil(err)
	suite.NotNil(cfg)
	suite.Nil(scheme.AddToScheme(scheme.Scheme))
	suite.Nil(istioScheme.AddToScheme(scheme.Scheme))
	suite.Nil(v1alpha1.AddToScheme(scheme.Scheme))
	suite.Nil(v1alpha2.AddToScheme(scheme.Scheme))

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

	//suite.Nil(NewApplicationReconciler(mgr).SetupWithManager(mgr))
	//suite.Nil(NewApplicationPluginReconciler(mgr).SetupWithManager(mgr))
	//suite.Nil(NewApplicationPluginBindingReconciler(mgr).SetupWithManager(mgr))
	//suite.Nil(NewKalmNamespacesReconciler(mgr).SetupWithManager(mgr))
	suite.Nil(NewKalmNSReconciler(mgr).SetupWithManager(mgr))
	suite.Nil(NewKalmPVCReconciler(mgr).SetupWithManager(mgr))

	suite.Nil(NewComponentReconciler(mgr).SetupWithManager(mgr))
	suite.Nil(NewComponentPluginReconciler(mgr).SetupWithManager(mgr))
	suite.Nil(NewComponentPluginBindingReconciler(mgr).SetupWithManager(mgr))

	suite.Nil(NewHttpsCertIssuerReconciler(mgr).SetupWithManager(mgr))
	suite.Nil(NewHttpsCertReconciler(mgr).SetupWithManager(mgr))

	suite.Nil(NewDockerRegistryReconciler(mgr).SetupWithManager(mgr))
	suite.Nil(NewHttpRouteReconciler(mgr).SetupWithManager(mgr))
	suite.Nil(NewGatewayReconciler(mgr).SetupWithManager(mgr))

	mgrStopChannel := make(chan struct{})
	suite.MgrStopChannel = mgrStopChannel

	go func() {
		err = mgr.Start(mgrStopChannel)
		suite.Nil(err)
	}()

	k8sClient := mgr.GetClient()
	suite.NotNil(k8sClient)

	suite.TestEnv = testEnv
	suite.K8sClient = k8sClient
	suite.Cfg = cfg
}

func (suite *BasicSuite) TearDownSuite() {
	if suite.MgrStopChannel != nil {
		suite.MgrStopChannel <- struct{}{}
	}

	if suite.TestEnv != nil {
		suite.Nil(suite.TestEnv.Stop())
	}
}

func (suite *BasicSuite) createHttpsCert(cert v1alpha1.HttpsCert) {
	suite.Nil(suite.K8sClient.Create(context.Background(), &cert))

	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(
			context.Background(),
			types.NamespacedName{Name: cert.Name},
			&cert,
		)

		return err == nil
	})
}

func (suite *BasicSuite) createHttpsCertIssuer(issuer v1alpha1.HttpsCertIssuer) {
	suite.Nil(suite.K8sClient.Create(context.Background(), &issuer))

	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(
			context.Background(),
			types.NamespacedName{
				Name: issuer.Name,
			},
			&issuer,
		)

		return err == nil
	})
}

var letterRunes = []rune("abcdefghijklmnopqrstuvwxyz")

func randomName() string {
	b := make([]rune, 12)
	for i := range b {
		b[i] = letterRunes[rand.Intn(len(letterRunes))]
	}
	return string(b)
}

func (suite *BasicSuite) SetupKalmEnabledNs() v1.Namespace {
	ns := v1.Namespace{
		ObjectMeta: metaV1.ObjectMeta{
			Name: randomName(),
			Labels: map[string]string{
				KalmEnableLabelName: "true",
			},
		},
	}
	suite.Nil(suite.K8sClient.Create(context.Background(), &ns))
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: ns.Name}, &ns)
		return err == nil
	})

	return ns
}
