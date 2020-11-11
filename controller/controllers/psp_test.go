package controllers

import (
	"context"
	"fmt"
	"github.com/jetstack/cert-manager/pkg/api"
	"github.com/kalmhq/kalm/controller/api/builtin"
	"github.com/stretchr/testify/suite"
	"io/ioutil"
	appsV1 "k8s.io/api/apps/v1"
	authorizationv1 "k8s.io/api/authorization/v1"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/api/policy/v1beta1"
	rbacV1 "k8s.io/api/rbac/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes"
	"math/rand"
	"path/filepath"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/envtest"
	"sigs.k8s.io/controller-runtime/pkg/webhook"
	"testing"
	"time"

	"github.com/jetstack/cert-manager/pkg/apis/certmanager/v1alpha2"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	istioScheme "istio.io/client-go/pkg/clientset/versioned/scheme"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes/scheme"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"
)

type PSPSuite struct {
	BasicSuite

	ns  *coreV1.Namespace
	ctx context.Context
}

func (suite *PSPSuite) SetupSuite() {
	//the version of api-server need >= 1.16.13
	//os.Setenv("TEST_ASSET_KUBE_APISERVER", "/usr/local/kubebuilder/bin/kube-apiserver-1.19.2")
	logf.SetLogger(zap.New(zap.UseDevMode(true)))

	suite.Nil(scheme.AddToScheme(scheme.Scheme))
	suite.Nil(istioScheme.AddToScheme(scheme.Scheme))
	suite.Nil(v1alpha1.AddToScheme(scheme.Scheme))
	suite.Nil(v1alpha2.AddToScheme(scheme.Scheme))

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
		WebhookInstallOptions: envtest.WebhookInstallOptions{
			DirectoryPaths: []string{
				filepath.Join("..", "config", "webhook"),
			},
			MaxTime: time.Duration(30 * time.Second),
		},
		KubeAPIServerFlags: []string{"--advertise-address=127.0.0.1",
			"--etcd-servers={{ if .EtcdURL }}{{ .EtcdURL.String }}{{ end }}",
			"--cert-dir={{ .CertDir }}",
			"--insecure-port={{ if .URL }}{{ .URL.Port }}{{ end }}",
			"--insecure-bind-address={{ if .URL }}{{ .URL.Hostname }}{{ end }}",
			"--secure-port={{ if .SecurePort }}{{ .SecurePort }}{{ end }}",
			// we're keeping this disabled because if enabled, default SA is missing which would force all tests to create one
			// in normal apiserver operation this SA is created by controller, but that is not run in integration environment
			//"--disable-admission-plugins=ServiceAccount",
			"--service-cluster-ip-range=10.0.0.0/24",
			"--allow-privileged=true",
			"--authorization-mode=RBAC",
			"--enable-admission-plugins=PodSecurityPolicy,ServiceAccount"},
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

	webhookServer := mgr.GetWebhookServer()
	webhookServer.Register("/validate-v1-ns", &webhook.Admission{
		Handler: &builtin.NSValidator{},
	})
	webhookServer.Register("/admission-handler-v1-pvc", &webhook.Admission{
		Handler: &builtin.PVCAdmissionHandler{},
	})
	webhookServer.Register("/admission-handler-v1-pod", &webhook.Admission{
		Handler: &builtin.PodAdmissionHandler{},
	})
	webhookServer.Register("/admission-handler-v1-svc", &webhook.Admission{
		Handler: &builtin.SvcAdmissionHandler{},
	})

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

	v1alpha1.InitializeWebhookClient(mgr)
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

	decode := api.Codecs.UniversalDeserializer().Decode

	pspRestrictedBytes, _ := ioutil.ReadFile("../../operator/config/psp/psp_restricted.yaml")
	pspPrivilegedBytes, _ := ioutil.ReadFile("../../operator/config/psp/psp_privileged.yaml")
	roleRestrictedBytes, _ := ioutil.ReadFile("../../operator/config/rbac/psp_restricted_role.yaml")
	rolePrivilegedBytes, _ := ioutil.ReadFile("../../operator/config/rbac/psp_privileged_role.yaml")

	pspRestricted, _, _ := decode(pspRestrictedBytes, nil, nil)
	pspPrivileged, _, _ := decode(pspPrivilegedBytes, nil, nil)
	rolePrivileged, _, _ := decode(rolePrivilegedBytes, nil, nil)
	roleRestricted, _, _ := decode(roleRestrictedBytes, nil, nil)

	suite.createObject(pspRestricted.(*v1beta1.PodSecurityPolicy))
	suite.createObject(pspPrivileged.(*v1beta1.PodSecurityPolicy))
	suite.createObject(rolePrivileged.(*rbacV1.ClusterRole))
	suite.createObject(roleRestricted.(*rbacV1.ClusterRole))
}

func (suite *PSPSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *PSPSuite) SetupTest() {
	ns := suite.SetupKalmEnabledNs("")
	suite.ns = &ns
	suite.ctx = context.Background()
}

func TestPSPSuite(t *testing.T) {
	suite.Run(t, new(PSPSuite))
}

func (suite *PSPSuite) TestPSP() {
	// test psp and psp clusterrole
	var restrictedPSP v1beta1.PodSecurityPolicy
	var privilegedPSP v1beta1.PodSecurityPolicy
	restrictedPSPErr := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: "restricted"}, &restrictedPSP)
	privilegedPSPErr := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: "privileged"}, &privilegedPSP)

	suite.Nil(restrictedPSPErr)
	suite.Nil(privilegedPSPErr)

	var restrictedRole rbacV1.ClusterRole
	var privilegedRole rbacV1.ClusterRole

	restrictedRoleErr := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: "system:psp:restricted"}, &restrictedRole)
	privilegedRoleErr := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: "system:psp:privileged"}, &privilegedRole)

	suite.Nil(restrictedRoleErr)
	suite.Nil(privilegedRoleErr)

	suite.EqualValues("system:psp:restricted", restrictedRole.Name)
	suite.EqualValues("system:psp:privileged", privilegedRole.Name)

	// test clusterrolebinding and psp auth
	// create service account
	sa := coreV1.ServiceAccount{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      "default",
			Namespace: suite.ns.Name,
		},
		Secrets: []coreV1.ObjectReference{{
			Name: "default-user-token",
		}},
	}

	token := coreV1.Secret{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      "default-user-token",
			Namespace: suite.ns.Name,
			Annotations: map[string]string{
				"kubernetes.io/service-account.name": "default-user-token",
			},
		},
		Type: coreV1.SecretTypeServiceAccountToken,
	}

	suite.createObject(&sa)
	suite.createObject(&token)

	component := generateEmptyComponent(suite.ns.Name)
	suite.createComponent(component)

	key := types.NamespacedName{
		Namespace: component.Namespace,
		Name:      component.Name,
	}

	suite.Eventually(func() bool {
		var deployment appsV1.Deployment

		if err := suite.K8sClient.Get(context.Background(), key, &deployment); err != nil {
			return false
		}

		return deployment.Spec.Template.Labels["foo"] == "bar"
	}, "can't get deployment")

	pspClusterRoleBinding := rbacV1.ClusterRoleBinding{}
	bindingErr := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: fmt.Sprintf("psp-%s-default", suite.ns.Name)}, &pspClusterRoleBinding)
	suite.Nil(bindingErr)
	suite.EqualValues(fmt.Sprintf("psp-%s-default", suite.ns.Name), pspClusterRoleBinding.Name)

	clientset, err := kubernetes.NewForConfig(suite.Cfg)
	suite.Nil(err)

	//can use restrictedPSP
	a := clientset.AuthorizationV1().SubjectAccessReviews()
	sar := &authorizationv1.SubjectAccessReview{
		Spec: authorizationv1.SubjectAccessReviewSpec{
			ResourceAttributes: &authorizationv1.ResourceAttributes{
				Namespace: suite.ns.Name,
				Verb:      "use",
				Resource:  "podsecuritypolicies",
				Name:      restrictedPSP.Name,
				Group:     "policy",
			},
			User: fmt.Sprintf("system:serviceaccount:%s:default", suite.ns.Name),
		},
	}

	response, err := a.Create(context.TODO(), sar, metaV1.CreateOptions{})
	suite.Nil(err)
	suite.EqualValues(true, response.Status.Allowed)

	//can not use privilegedPSP
	sarPSPPrivileged := &authorizationv1.SubjectAccessReview{
		Spec: authorizationv1.SubjectAccessReviewSpec{
			ResourceAttributes: &authorizationv1.ResourceAttributes{
				Namespace: suite.ns.Name,
				Verb:      "use",
				Resource:  "podsecuritypolicies",
				Name:      privilegedPSP.Name,
				Group:     "policy",
			},
			User: fmt.Sprintf("system:serviceaccount:%s:default", suite.ns.Name),
		},
	}

	responseSarPSPPrivileged, err := a.Create(context.TODO(), sarPSPPrivileged, metaV1.CreateOptions{})
	suite.Nil(err)
	suite.EqualValues(false, responseSarPSPPrivileged.Status.Allowed)
}
