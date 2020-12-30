package client

import (
	"context"
	"fmt"
	"path/filepath"
	"testing"
	"time"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/assert"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/deprecated/scheme"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/envtest"
)

func TestPolicyUpdate(t *testing.T) {
	assert.Nil(t, scheme.AddToScheme(scheme.Scheme))
	assert.Nil(t, v1alpha1.AddToScheme(scheme.Scheme))

	testEnv := &envtest.Environment{
		CRDDirectoryPaths: []string{filepath.Join("..", "..", "controller", "config", "crd", "bases")},
	}

	cfg, err := testEnv.Start()
	assert.Nil(t, err)

	clientMgr := NewStandardClientManager(cfg)

	mClient, err := client.New(cfg, client.Options{Scheme: scheme.Scheme})
	assert.Nil(t, err)

	tenantName := "foo"
	owner := "f@bar.com"
	sub := ToSafeSubject(owner, v1alpha1.SubjectTypeUser)

	// before create tenant
	scope := fmt.Sprintf("%s/*", tenantName)
	assert.False(t, clientMgr.RBACEnforcer.CanViewScope(sub, scope))

	tenant := v1alpha1.Tenant{
		ObjectMeta: metav1.ObjectMeta{
			Name: tenantName,
		},
		Spec: v1alpha1.TenantSpec{
			Owners:        []string{owner},
			ResourceQuota: v1alpha1.ResourceList{},
		},
	}

	err = mClient.Create(context.Background(), &tenant)
	assert.Nil(t, err)

	clientMgr.UpdatePolicies()
	for _, p := range clientMgr.RBACEnforcer.GetPolicy() {
		fmt.Println("policy:", p)
	}
	for _, g := range clientMgr.RBACEnforcer.GetGroupingPolicy() {
		fmt.Println("group policy:", g)
	}

	// after create tenant
	assert.Eventually(t, func() bool {
		return clientMgr.RBACEnforcer.CanViewScope(sub, scope)
	}, 5*time.Second, 100*time.Millisecond, fmt.Sprintf("sub(%s) should can view scope(%s)", sub, scope))
}
