package client

import (
	"fmt"
	"path/filepath"
	"testing"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/assert"
	"k8s.io/client-go/deprecated/scheme"
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

	clientMgr := NewStandardClientManager(cfg, "")

	owner := "f@bar.com"
	sub := ToSafeSubject(owner, v1alpha1.SubjectTypeUser)

	assert.False(t, clientMgr.RBACEnforcer.CanViewNamespace(sub, "*"))

	clientMgr.UpdatePolicies()
	for _, p := range clientMgr.RBACEnforcer.GetPolicy() {
		fmt.Println("policy:", p)
	}
	for _, g := range clientMgr.RBACEnforcer.GetGroupingPolicy() {
		fmt.Println("group policy:", g)
	}
}
