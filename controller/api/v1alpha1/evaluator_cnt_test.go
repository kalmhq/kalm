package v1alpha1

import (
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	admissionv1beta1 "k8s.io/api/admission/v1beta1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes/scheme"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/envtest"
)

func TestEvaluatorNotExist(t *testing.T) {
	tenant := Tenant{
		ObjectMeta: metav1.ObjectMeta{
			Name: "fake-tenant",
		},
		Spec: TenantSpec{
			TenantDisplayName: "test-tenant",
			ResourceQuota: map[ResourceName]resource.Quantity{
				ResourceDockerRegistriesCount: resource.MustParse("100"),
			},
			Owners: []string{"david"},
		},
	}

	dockerRegistry := DockerRegistry{
		ObjectMeta: metav1.ObjectMeta{
			Name: "fake-docker-registry-for-test",
			Labels: map[string]string{
				TenantNameLabelKey: tenant.Name,
			},
		},
		Spec: DockerRegistrySpec{
			Host: "https://gcr.io",
		},
	}

	reqInfo := AdmissionRequestInfo{
		Operation: admissionv1beta1.Create,
		Obj:       &dockerRegistry,
		IsDryRun:  false,
	}

	_, err := checkAdmissionRequestAgainstTenant(tenant, reqInfo)
	assert.Equal(t, EvaluatorNotExistError, err)
}

func TestUsage(t *testing.T) {

	assert.Nil(t, scheme.AddToScheme(scheme.Scheme))
	assert.Nil(t, AddToScheme(scheme.Scheme))

	testEnv := &envtest.Environment{
		CRDDirectoryPaths: []string{
			filepath.Join("..", "..", "config", "crd", "bases"),
			filepath.Join("..", "..", "resources", "istio"),
			filepath.Join("..", "..", "resources"),
		},
	}

	cfg, err := testEnv.Start()
	assert.Nil(t, err)
	assert.NotNil(t, cfg)

	mgrOptions := ctrl.Options{
		Scheme:  scheme.Scheme,
		Port:    testEnv.WebhookInstallOptions.LocalServingPort,
		Host:    testEnv.WebhookInstallOptions.LocalServingHost,
		CertDir: testEnv.WebhookInstallOptions.LocalServingCertDir,
	}

	mgr, err := ctrl.NewManager(cfg, mgrOptions)
	assert.Nil(t, err)

	InitializeWebhookClient(mgr)

	mgrStopChannel := make(chan struct{})
	go func() {
		err = mgr.Start(mgrStopChannel)
		assert.Nil(t, err)
	}()

	client := mgr.GetClient()
	assert.NotNil(t, client)

	tenantName := "fake-tenant-name"

	dockerRegistry := DockerRegistry{
		TypeMeta: metav1.TypeMeta{
			Kind:       "DockerRegistry",
			APIVersion: GroupVersion.Group + "/" + GroupVersion.Version,
		},
		ObjectMeta: metav1.ObjectMeta{
			Name: "fake-docker-registry-for-test",
			Labels: map[string]string{
				TenantNameLabelKey: tenantName,
			},
		},
		Spec: DockerRegistrySpec{
			Host: "https://gcr.io",
		},
	}

	reqInfo := AdmissionRequestInfo{
		Operation: admissionv1beta1.Create,
		Obj:       &dockerRegistry,
		IsDryRun:  false,
	}

	tenant := Tenant{
		ObjectMeta: metav1.ObjectMeta{
			Name: tenantName,
		},
		Spec: TenantSpec{
			TenantDisplayName: "test-tenant",
			ResourceQuota: map[ResourceName]resource.Quantity{
				ResourceDockerRegistriesCount: resource.MustParse("100"),
			},
			Owners: []string{"david"},
		},
	}

	newTenant, err := checkAdmissionRequestAgainstTenant(tenant, reqInfo)
	assert.Nil(t, err)

	newCnt := newTenant.Status.UsedResourceQuota[ResourceDockerRegistriesCount]
	newCntIsOne := newCnt.Cmp(resource.MustParse("1")) == 0
	assert.True(t, newCntIsOne)

	close(mgrStopChannel)
}
