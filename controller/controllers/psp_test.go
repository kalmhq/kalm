package controllers

import (
	"context"
	"fmt"
	"github.com/davecgh/go-spew/spew"
	"github.com/jetstack/cert-manager/pkg/api"
	"github.com/stretchr/testify/suite"
	"io/ioutil"
	appsV1 "k8s.io/api/apps/v1"
	authorizationv1 "k8s.io/api/authorization/v1"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/api/policy/v1beta1"
	rbacV1 "k8s.io/api/rbac/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes"
	"path/filepath"
	"sigs.k8s.io/controller-runtime/pkg/envtest"
	"testing"
	"time"

	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type PSPSuite struct {
	BasicSuite

	ns  *coreV1.Namespace
	ctx context.Context
}

func (suite *PSPSuite) SetupSuite() {
	//the version of api-server need >= 1.16.13
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

	suite.SetupTestEnv(testEnv)
}

func (suite *PSPSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *PSPSuite) SetupTest() {
	ns := suite.SetupKalmEnabledNs("")
	suite.ns = &ns
	suite.ctx = context.Background()

	//init psp and psp roles
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

func TestPSPSuite(t *testing.T) {
	suite.Run(t, new(PSPSuite))
}

func (suite *PSPSuite) TestPSP() {
	// test psp and psp clusterrole
	var restrictedPSP v1beta1.PodSecurityPolicy
	var privilegedPSP v1beta1.PodSecurityPolicy
	restrictedPSPErr := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: "kalm-restricted"}, &restrictedPSP)
	privilegedPSPErr := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: "kalm-privileged"}, &privilegedPSP)

	suite.Nil(restrictedPSPErr)
	spew.Dump(restrictedPSP)
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
	spew.Dump("response", response)
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
