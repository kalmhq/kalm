package controllers

import (
	"context"
	"fmt"
	"github.com/jetstack/cert-manager/pkg/api"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
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

func (suite *PSPSuite) TestCreateDefaultSaAndPSPRoleBinding() {
	// test psp and psp clusterrole
	var restrictedPSP v1beta1.PodSecurityPolicy
	var privilegedPSP v1beta1.PodSecurityPolicy
	restrictedPSPErr := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: "kalm-restricted"}, &restrictedPSP)
	privilegedPSPErr := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: "kalm-privileged"}, &privilegedPSP)

	suite.Nil(restrictedPSPErr)
	suite.Nil(privilegedPSPErr)
	suite.Nil(privilegedPSPErr)

	var restrictedRole rbacV1.ClusterRole
	var privilegedRole rbacV1.ClusterRole

	restrictedRoleErr := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: "system:psp:restricted"}, &restrictedRole)
	privilegedRoleErr := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: "system:psp:privileged"}, &privilegedRole)

	suite.Nil(restrictedRoleErr)
	suite.Nil(privilegedRoleErr)

	suite.EqualValues("system:psp:restricted", restrictedRole.Name)
	suite.EqualValues("system:psp:privileged", privilegedRole.Name)

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

	// test clusterrolebinding and psp auth
	// create service account
	defaultServiceAccountName := fmt.Sprintf("component-%s", component.Name)
	sa := coreV1.ServiceAccount{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      defaultServiceAccountName,
			Namespace: suite.ns.Name,
		},
	}

	errGetSa := suite.K8sClient.Get(context.Background(), types.NamespacedName{Namespace: suite.ns.Name, Name: defaultServiceAccountName}, &sa)
	suite.Nil(errGetSa)

	pspClusterRoleBinding := rbacV1.ClusterRoleBinding{}
	bindingErr := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: fmt.Sprintf("psp-%s-%s", suite.ns.Name, sa.Name)}, &pspClusterRoleBinding)
	suite.Nil(bindingErr)
	suite.EqualValues(fmt.Sprintf("psp-%s-%s", suite.ns.Name, sa.Name), pspClusterRoleBinding.Name)

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
			User: fmt.Sprintf("system:serviceaccount:%s:%s", suite.ns.Name, sa.Name),
		},
	}

	response, err := a.Create(context.TODO(), sar, metaV1.CreateOptions{})
	suite.Nil(err)
	suite.EqualValues(true, response.Status.Allowed)
}

func (suite *PSPSuite) TestCreatePodUsingPSP() {
	var restrictedPSP v1beta1.PodSecurityPolicy
	restrictedPSPErr := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: "kalm-restricted"}, &restrictedPSP)
	suite.Nil(restrictedPSPErr)

	var restrictedRole rbacV1.ClusterRole
	restrictedRoleErr := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: "system:psp:restricted"}, &restrictedRole)
	suite.Nil(restrictedRoleErr)
	suite.EqualValues("system:psp:restricted", restrictedRole.Name)

	//cannot create pod as root
	isPrivileged := true
	var runAsUser int64
	runAsUser = 0
	podPrivileged := coreV1.Pod{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      "privileged-pod",
			Namespace: suite.ns.Name,
			Labels: map[string]string{
				v1alpha1.TenantNameLabelKey: "test",
			},
		},
		Spec: coreV1.PodSpec{
			Containers: []coreV1.Container{{
				Name:  "nginx",
				Image: "nginx:latest",
				SecurityContext: &coreV1.SecurityContext{
					Privileged:               &isPrivileged,
					AllowPrivilegeEscalation: &isPrivileged,
					RunAsUser:                &runAsUser,
				},
			}},
		},
	}

	errPrivileged := suite.K8sClient.Create(context.Background(), &podPrivileged)
	suite.Nil(errPrivileged)

}
