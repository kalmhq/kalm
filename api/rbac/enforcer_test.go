package rbac

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestEnforcer(t *testing.T) {
	policyAdapter := NewStringPolicyAdapter(`
p, role_ns1Viewer, view, tenant1/ns1, */*
p, role_ns1Editor, edit, tenant1/ns1, */*
g, role_ns1Editor, role_ns1Viewer
g, role_ns1Owner, role_ns1Editor
p, role_ns1Owner, manage, tenant1/ns1, */*

p, role_ns2Viewer, view, tenant1/ns2, */*
p, role_ns2Editor, edit, tenant1/ns2, */*
p, role_ns2Owner, manage, tenant1/ns2, */*
g, role_ns2Editor, role_ns2Viewer
g, role_ns2Owner, role_ns2Editor

p, role_clusterViewer, view, */*, */*
p, role_clusterEditor, edit, */*, */*
g, role_clusterEditor, role_clusterViewer
g, role_clusterOwner, role_clusterEditor
p, role_clusterOwner, manage, */*, */*

g, ns1Viewer, role_ns1Viewer
g, ns1Editor, role_ns1Editor
g, ns1Owner, role_ns1Owner

g, clusterViewer, role_clusterViewer
g, clusterEditor, role_clusterEditor
g, clusterOwner, role_clusterOwner

# Nio can edit any component under ns2
p, Nio, edit, */ns2, components/*
`)

	e, err := NewEnforcer(policyAdapter)

	assert.Nil(t, err)

	directlyAndRebuildWithPartialPoliciesTest(e, "ns1Viewer", func(e Enforcer, helperMessage string) {
		assert.True(t, e.CanViewNamespace("ns1Viewer", "tenant1/ns1"), helperMessage)
		assert.False(t, e.CanEditNamespace("ns1Viewer", "tenant1/ns1"), helperMessage)
		assert.False(t, e.CanManageNamespace("ns1Viewer", "tenant1/ns1"), helperMessage)
		assert.False(t, e.CanViewNamespace("ns1Viewer", "tenant1/ns2"), helperMessage)
		assert.False(t, e.CanEditNamespace("ns1Viewer", "tenant1/ns2"), helperMessage)
		assert.False(t, e.CanManageNamespace("ns1Viewer", "tenant1/ns2"), helperMessage)
	})

	directlyAndRebuildWithPartialPoliciesTest(e, "ns1Editor", func(e Enforcer, helperMessage string) {
		assert.True(t, e.CanViewNamespace("ns1Editor", "tenant1/ns1"), helperMessage)
		assert.True(t, e.CanEditNamespace("ns1Editor", "tenant1/ns1"), helperMessage)
		assert.False(t, e.CanManageNamespace("ns1Editor", "tenant1/ns1"), helperMessage)
		assert.False(t, e.CanViewNamespace("ns1Editor", "tenant1/ns2"), helperMessage)
		assert.False(t, e.CanEditNamespace("ns1Editor", "tenant1/ns2"), helperMessage)
		assert.False(t, e.CanManageNamespace("ns1Editor", "tenant1/ns2"), helperMessage)
	})

	directlyAndRebuildWithPartialPoliciesTest(e, "ns1Owner", func(e Enforcer, helperMessage string) {
		assert.True(t, e.CanViewNamespace("ns1Owner", "tenant1/ns1"), helperMessage)
		assert.True(t, e.CanEditNamespace("ns1Owner", "tenant1/ns1"), helperMessage)
		assert.True(t, e.CanManageNamespace("ns1Owner", "tenant1/ns1"), helperMessage)
		assert.False(t, e.CanViewNamespace("ns1Owner", "tenant1/ns2"), helperMessage)
		assert.False(t, e.CanEditNamespace("ns1Owner", "tenant1/ns2"), helperMessage)
		assert.False(t, e.CanManageNamespace("ns1Owner", "tenant1/ns2"), helperMessage)
	})

	directlyAndRebuildWithPartialPoliciesTest(e, "clusterViewer", func(e Enforcer, helperMessage string) {
		assert.True(t, e.CanViewNamespace("clusterViewer", "tenant1/ns1"), helperMessage)
		assert.False(t, e.CanEditNamespace("clusterViewer", "tenant1/ns1"), helperMessage)
		assert.False(t, e.CanManageNamespace("clusterViewer", "tenant1/ns1"), helperMessage)
		assert.True(t, e.CanViewNamespace("clusterViewer", "tenant1/ns2"), helperMessage)
		assert.False(t, e.CanEditNamespace("clusterViewer", "tenant1/s2"), helperMessage)
		assert.False(t, e.CanManageNamespace("clusterViewer", "tenant1/ns2"), helperMessage)
	})

	directlyAndRebuildWithPartialPoliciesTest(e, "clusterEditor", func(e Enforcer, helperMessage string) {
		assert.True(t, e.CanViewNamespace("clusterEditor", "tenant1/ns1"), helperMessage)
		assert.True(t, e.CanEditNamespace("clusterEditor", "tenant1/ns1"), helperMessage)
		assert.False(t, e.CanManageNamespace("clusterEditor", "tenant1/ns1"), helperMessage)
		assert.True(t, e.CanViewNamespace("clusterEditor", "tenant1/ns2"), helperMessage)
		assert.True(t, e.CanEditNamespace("clusterEditor", "tenant1/ns2"), helperMessage)
		assert.False(t, e.CanManageNamespace("clusterEditor", "tenant1/ns2"), helperMessage)

	})

	directlyAndRebuildWithPartialPoliciesTest(e, "clusterOwner", func(e Enforcer, helperMessage string) {
		assert.True(t, e.CanViewNamespace("clusterOwner", "tenant1/ns1"), helperMessage)
		assert.True(t, e.CanEditNamespace("clusterOwner", "tenant1/ns1"), helperMessage)
		assert.True(t, e.CanManageNamespace("clusterOwner", "tenant1/ns1"), helperMessage)
		assert.True(t, e.CanViewNamespace("clusterOwner", "tenant1/ns2"), helperMessage)
		assert.True(t, e.CanEditNamespace("clusterOwner", "tenant1/ns2"), helperMessage)
		assert.True(t, e.CanManageNamespace("clusterOwner", "tenant1/ns2"), helperMessage)

	})

	// Special cases
	directlyAndRebuildWithPartialPoliciesTest(e, "Nio", func(e Enforcer, helperMessage string) {
		assert.True(t, e.Can("Nio", "edit", "tenant1/ns2", "components/abc"), helperMessage)
		assert.True(t, e.Can("Nio", "edit", "tenant2/ns2", "components/abc"), helperMessage)
		assert.False(t, e.Can("Nio", "edit", "tenant1/ns2", "pod/abc"), helperMessage)
		assert.False(t, e.Can("Nio", "edit", "tenant1/ns3", "components/abc"), helperMessage)
		assert.Equal(t, "p, Nio, edit, */ns2, components/*", e.GetCompletePoliciesFor("Nio"), helperMessage)
	})
}

// 1) Directly test is use the server side completed policies to test
// 2) Partial policies test is only using the policies that are related with the subject to test.
//    This is a simulation for frontend, since the user can only get policies that relate to him/her.
func directlyAndRebuildWithPartialPoliciesTest(oldEnforcer Enforcer, sub string, fn func(e Enforcer, helperMessage string)) {
	// directly test
	fn(oldEnforcer, "directly test")

	// create a new enforcer with abbreviated policies
	policies := oldEnforcer.GetCompletePoliciesFor(sub)
	policyAdapter := NewStringPolicyAdapter(policies)
	e, _ := NewEnforcer(policyAdapter)

	// test again
	fn(e, "partial policies test")
}
