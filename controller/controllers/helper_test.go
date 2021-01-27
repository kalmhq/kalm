package controllers

import (
	"context"
	"fmt"
	"math/rand"
	"net"
	"path/filepath"
	"time"

	istioScheme "istio.io/client-go/pkg/clientset/versioned/scheme"

	"github.com/jetstack/cert-manager/pkg/apis/certmanager/v1alpha2"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/envtest"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"
)

func init() {
	rand.Seed(time.Now().UnixNano())
}

type BasicSuite struct {
	suite.Suite

	Cfg         *rest.Config
	K8sClient   client.Client
	TestEnv     *envtest.Environment
	StopChannel chan struct{}
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
		return err == nil
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

func getDockerRegistryNamespacedName(registry *v1alpha1.DockerRegistry) types.NamespacedName {
	return types.NamespacedName{Name: registry.Name, Namespace: registry.Namespace}
}

func (suite *BasicSuite) createDockerRegistry(registry *v1alpha1.DockerRegistry) {
	suite.Nil(suite.K8sClient.Create(context.Background(), registry))

	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), getDockerRegistryNamespacedName(registry), registry)

		return err == nil
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
	suite.Require().Nil(suite.K8sClient.Create(context.Background(), obj))
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

// Infinit loop. Caller needs to handle timeout
func waitPortConnectable(addr string) {
	var conn net.Conn
	var err error

	var firstRun bool

	for {
		if !firstRun {
			time.Sleep(50 * time.Millisecond)
		}

		conn, err = net.DialTimeout("tcp", addr, time.Duration(3)*time.Second)

		if err != nil {
			continue
		}

		if conn == nil {
			continue
		}

		conn.Close()
		break
	}
}

func (suite *BasicSuite) SetupTestEnv(testEnv *envtest.Environment, disableWebhookOpt ...bool) {
	if testEnv == nil {
		panic("must setup testENV")
	}

	suite.Nil(scheme.AddToScheme(scheme.Scheme))
	suite.Nil(istioScheme.AddToScheme(scheme.Scheme))
	suite.Nil(v1alpha1.AddToScheme(scheme.Scheme))
	suite.Nil(v1alpha2.AddToScheme(scheme.Scheme))

	disableWebhook := len(disableWebhookOpt) > 0 && disableWebhookOpt[0]
	if !disableWebhook {
		testEnv.WebhookInstallOptions = envtest.WebhookInstallOptions{
			DirectoryPaths: []string{
				filepath.Join("..", "config", "webhook"),
			},
			MaxTime: time.Duration(30 * time.Second),
		}
	}

	var err error
	cfg, err := testEnv.Start()
	suite.Nil(err)
	suite.NotNil(cfg)

	// +kubebuilder:scaffold:scheme

	zapLog := zap.Logger(true)

	min := 2000
	max := 8000
	port := rand.Intn(max-min) + min

	mgrOptions := ctrl.Options{
		Scheme:             scheme.Scheme,
		MetricsBindAddress: fmt.Sprintf("localhost:%d", port),
		Logger:             zapLog,
		Port:               testEnv.WebhookInstallOptions.LocalServingPort,
		Host:               testEnv.WebhookInstallOptions.LocalServingHost,
		CertDir:            testEnv.WebhookInstallOptions.LocalServingCertDir,
	}

	mgr, err := ctrl.NewManager(cfg, mgrOptions)

	suite.Require().NotNil(mgr)
	suite.Require().Nil(err)

	suite.Require().Nil(NewKalmNSReconciler(mgr).SetupWithManager(mgr))
	suite.Require().Nil(NewKalmPVCReconciler(mgr).SetupWithManager(mgr))
	suite.Require().Nil(NewKalmPVReconciler(mgr).SetupWithManager(mgr))

	suite.Require().Nil(NewComponentReconciler(mgr).SetupWithManager(mgr))
	suite.Require().Nil(NewComponentPluginReconciler(mgr).SetupWithManager(mgr))
	suite.Require().Nil(NewComponentPluginBindingReconciler(mgr).SetupWithManager(mgr))

	suite.Require().Nil(NewHttpsCertIssuerReconciler(mgr).SetupWithManager(mgr))
	suite.Require().Nil(NewHttpsCertReconciler(mgr).SetupWithManager(mgr))

	suite.Require().Nil(NewDockerRegistryReconciler(mgr).SetupWithManager(mgr))
	suite.Require().Nil(NewHttpRouteReconciler(mgr).SetupWithManager(mgr))
	suite.Require().Nil(NewGatewayReconciler(mgr).SetupWithManager(mgr))
	suite.Require().Nil(NewSingleSignOnConfigReconciler(mgr).SetupWithManager(mgr))
	suite.Require().Nil(NewProtectedEndpointReconciler(mgr).SetupWithManager(mgr))

	// v1alpha1.InitializeWebhookClient(mgr)
	suite.Require().Nil((&v1alpha1.AccessToken{}).SetupWebhookWithManager(mgr))
	suite.Require().Nil((&v1alpha1.RoleBinding{}).SetupWebhookWithManager(mgr))
	suite.Require().Nil((&v1alpha1.Component{}).SetupWebhookWithManager(mgr))
	suite.Require().Nil((&v1alpha1.ComponentPluginBinding{}).SetupWebhookWithManager(mgr))
	suite.Require().Nil((&v1alpha1.DockerRegistry{}).SetupWebhookWithManager(mgr))
	suite.Require().Nil((&v1alpha1.HttpRoute{}).SetupWebhookWithManager(mgr))
	suite.Require().Nil((&v1alpha1.HttpsCert{}).SetupWebhookWithManager(mgr))
	suite.Require().Nil((&v1alpha1.HttpsCertIssuer{}).SetupWebhookWithManager(mgr))
	suite.Require().Nil((&v1alpha1.ProtectedEndpoint{}).SetupWebhookWithManager(mgr))
	suite.Require().Nil((&v1alpha1.SingleSignOnConfig{}).SetupWebhookWithManager(mgr))
	suite.Require().Nil((&v1alpha1.LogSystem{}).SetupWebhookWithManager(mgr))
	suite.Require().Nil((&v1alpha1.ACMEServer{}).SetupWebhookWithManager(mgr))

	mgrStopChannel := make(chan struct{})
	suite.StopChannel = mgrStopChannel

	go func() {
		err = mgr.Start(mgrStopChannel)
		suite.Require().Nil(err)
	}()

	// wait webhook server is ready to accept requests.
	waitPortConnectable(fmt.Sprintf("%s:%d", mgrOptions.Host, mgrOptions.Port))

	// https://github.com/kubernetes-sigs/controller-runtime/issues/550#issuecomment-518818318
	client := mgr.GetClient()
	// client, err := client.New(cfg, client.Options{Scheme: scheme.Scheme})
	suite.NotNil(client)

	suite.TestEnv = testEnv
	suite.K8sClient = client
	suite.Cfg = cfg
}

func (suite *BasicSuite) SetupSuite(disableWebhookOpt ...bool) {
	logf.SetLogger(zap.New(zap.UseDevMode(true)))

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

	suite.SetupTestEnv(testEnv, disableWebhookOpt...)
}

func (suite *BasicSuite) TearDownSuite() {
	if suite.StopChannel != nil {
		suite.StopChannel <- struct{}{}
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

func (suite *BasicSuite) SetupKalmEnabledNs(nameOpt ...string) corev1.Namespace {

	var name string

	if len(nameOpt) > 0 && nameOpt[0] != "" {
		name = nameOpt[0]
	} else {
		name = randomName()
	}

	ns := corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: name,
			Labels: map[string]string{
				KalmEnableLabelName: "true",
			},
		},
	}

	suite.Require().Nil(suite.K8sClient.Create(context.Background(), &ns))

	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: ns.Name}, &ns)
		return err == nil
	})

	return ns
}

func (suite *BasicSuite) ensureNsExists(name string) corev1.Namespace {
	ns := corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: name,
			Labels: map[string]string{
				v1alpha1.KalmEnableLabelName: "true",
			},
		},
	}

	_ = suite.K8sClient.Create(context.Background(), &ns)

	return ns
}
