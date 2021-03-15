package controllers

import (
	"context"
	"fmt"
	"io/ioutil"
	"path/filepath"
	"testing"
	"time"

	"github.com/jetstack/cert-manager/pkg/api"
	"github.com/stretchr/testify/suite"
	appsV1 "k8s.io/api/apps/v1"
	authorizationv1 "k8s.io/api/authorization/v1"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/api/policy/v1beta1"
	rbacV1 "k8s.io/api/rbac/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes"
	"sigs.k8s.io/controller-runtime/pkg/envtest"

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
}

func TestPSPSuite(t *testing.T) {
	suite.Run(t, new(PSPSuite))
}

func (suite *PSPSuite) TestCreateDefaultSaAndPSPRoleBinding() {
	// test create pod using psp
	// create restricted psp and cluster role
	decode := api.Codecs.UniversalDeserializer().Decode

	pspRestrictedBytes, _ := ioutil.ReadFile("../../operator/config/psp/psp_restricted.yaml")
	roleRestrictedBytes, _ := ioutil.ReadFile("../../operator/config/rbac/psp_restricted_role.yaml")
	pspRestricted, _, _ := decode(pspRestrictedBytes, nil, nil)
	roleRestricted, _, _ := decode(roleRestrictedBytes, nil, nil)
	suite.createObject(pspRestricted.(*v1beta1.PodSecurityPolicy))
	suite.createObject(roleRestricted.(*rbacV1.ClusterRole))

	var restrictedRole rbacV1.ClusterRole
	var restrictedPSP v1beta1.PodSecurityPolicy
	suite.Eventually(func() bool {
		restrictedPSPErr := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: "kalm-restricted"}, &restrictedPSP)
		restrictedRoleErr := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: "system:psp:restricted"}, &restrictedRole)

		return restrictedPSPErr == nil && restrictedRoleErr == nil && "system:psp:restricted" == restrictedRole.Name
	}, "can't get psp")

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
				"kubernetes.io/service-account.name": "default",
			},
		},
		Type: coreV1.SecretTypeServiceAccountToken,
	}

	createSaErr := suite.K8sClient.Create(context.Background(), &sa)
	createTokenErr := suite.K8sClient.Create(context.Background(), &token)

	suite.Nil(createSaErr)
	suite.Nil(createTokenErr)

	//cannot create pod as root
	//privileged psp not allow these three value
	isPrivileged := true //
	allowPrivilegeEscalation := true
	runAsUser := int64(0)

	podPrivileged := coreV1.Pod{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      "privileged-pod",
			Namespace: suite.ns.Name,
		},
		Spec: coreV1.PodSpec{
			Containers: []coreV1.Container{{
				Name:  "nginx",
				Image: "nginx:latest",
				SecurityContext: &coreV1.SecurityContext{
					Privileged:               &isPrivileged,
					AllowPrivilegeEscalation: &allowPrivilegeEscalation,
					RunAsUser:                &runAsUser,
				},
			}},
			ServiceAccountName: sa.Name,
		},
	}

	errPrivileged := suite.K8sClient.Create(context.Background(), &podPrivileged)
	suite.NotNil(errPrivileged)
	suite.EqualValues("pods \"privileged-pod\" is forbidden: unable to validate against any pod security policy: [spec.containers[0].securityContext.runAsUser: Invalid value: 0: running with the root UID is forbidden spec.containers[0].securityContext.privileged: Invalid value: true: Privileged containers are not allowed spec.containers[0].securityContext.allowPrivilegeEscalation: Invalid value: true: Allowing privilege escalation for containers is not allowed]", errPrivileged.Error())

	// test create role binding and service account when creating component
	// init privileged psp and cluster role
	pspPrivilegedBytes, _ := ioutil.ReadFile("../../operator/config/psp/psp_privileged.yaml")
	rolePrivilegedBytes, _ := ioutil.ReadFile("../../operator/config/rbac/psp_privileged_role.yaml")
	pspPrivileged, _, _ := decode(pspPrivilegedBytes, nil, nil)
	rolePrivileged, _, _ := decode(rolePrivilegedBytes, nil, nil)
	suite.createObject(pspPrivileged.(*v1beta1.PodSecurityPolicy))
	suite.createObject(rolePrivileged.(*rbacV1.ClusterRole))

	var privilegedPSP v1beta1.PodSecurityPolicy
	var privilegedRole rbacV1.ClusterRole
	suite.Eventually(func() bool {
		privilegedPSPErr := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: "kalm-privileged"}, &privilegedPSP)
		privilegedRoleErr := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: "system:psp:privileged"}, &privilegedRole)

		return privilegedPSPErr == nil && privilegedRoleErr == nil && "system:psp:privileged" == privilegedRole.Name
	}, "can't get psp")

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

		return true
	}, "can't get deployment")

	// test role binding and psp auth
	// create service account
	defaultServiceAccountName := fmt.Sprintf("component-%s", component.Name)
	componentDefaultSa := coreV1.ServiceAccount{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      defaultServiceAccountName,
			Namespace: suite.ns.Name,
		},
	}
	pspRoleBinding := rbacV1.RoleBinding{}

	suite.Eventually(func() bool {
		errGetSa := suite.K8sClient.Get(context.Background(), types.NamespacedName{Namespace: suite.ns.Name, Name: defaultServiceAccountName}, &componentDefaultSa)
		errGetBinding := suite.K8sClient.Get(context.Background(), types.NamespacedName{Namespace: suite.ns.Name, Name: fmt.Sprintf("psp-%s-%s", suite.ns.Name, componentDefaultSa.Name)}, &pspRoleBinding)

		return errGetSa == nil && errGetBinding == nil && fmt.Sprintf("psp-%s-%s", suite.ns.Name, componentDefaultSa.Name) == pspRoleBinding.Name
	}, "can't get sa or role binding")

	clientSet, err := kubernetes.NewForConfig(suite.Cfg)
	suite.Nil(err)

	//can use restrictedPSP
	a := clientSet.AuthorizationV1().SubjectAccessReviews()
	sar := &authorizationv1.SubjectAccessReview{
		Spec: authorizationv1.SubjectAccessReviewSpec{
			ResourceAttributes: &authorizationv1.ResourceAttributes{
				Namespace: suite.ns.Name,
				Verb:      "use",
				Resource:  "podsecuritypolicies",
				Name:      restrictedPSP.Name,
				Group:     "policy",
			},
			User: fmt.Sprintf("system:serviceaccount:%s:%s", suite.ns.Name, componentDefaultSa.Name),
		},
	}

	response, err := a.Create(context.TODO(), sar, metaV1.CreateOptions{})
	suite.Nil(err)
	suite.EqualValues(true, response.Status.Allowed)
}
