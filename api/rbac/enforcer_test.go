package rbac

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestEnforcer(t *testing.T) {
	e, err := NewEnforcer(NewStringPolicyAdapter(`
p, role_ns1Viewer, view, ns1, *
p, role_ns1Editor, edit, ns1, *
g, role_ns1Editor, role_ns1Viewer
g, role_ns1Owner, role_ns1Editor
p, role_ns1Owner, manage, ns1, *

p, role_ns2Viewer, view, ns2, *
p, role_ns2Editor, edit, ns2, *
p, role_ns2Owner, manage, ns2, *
g, role_ns2Editor, role_ns2Viewer
g, role_ns2Owner, role_ns2Editor

p, role_clusterViewer, view, *, *
p, role_clusterEditor, edit, *, *
g, role_clusterEditor, role_clusterViewer
g, role_clusterOwner, role_clusterEditor
p, role_clusterOwner, manage, *, *

g, ns1Viewer, role_ns1Viewer
g, ns1Editor, role_ns1Editor
g, ns1Owner, role_ns1Owner

g, clusterViewer, role_clusterViewer
g, clusterEditor, role_clusterEditor
g, clusterOwner, role_clusterOwner

# Nio can edit any component under ns2
p, Nio, edit, ns2, components/*
`))

	assert.Nil(t, err)

	assert.True(t, e.CanViewNamespace("ns1Viewer", "ns1"))
	assert.False(t, e.CanEditNamespace("ns1Viewer", "ns1"))
	assert.False(t, e.CanManageNamespace("ns1Viewer", "ns1"))
	assert.False(t, e.CanViewNamespace("ns1Viewer", "ns2"))
	assert.False(t, e.CanEditNamespace("ns1Viewer", "ns2"))
	assert.False(t, e.CanManageNamespace("ns1Viewer", "ns2"))

	assert.True(t, e.CanViewNamespace("ns1Editor", "ns1"))
	assert.True(t, e.CanEditNamespace("ns1Editor", "ns1"))
	assert.False(t, e.CanManageNamespace("ns1Editor", "ns1"))
	assert.False(t, e.CanViewNamespace("ns1Editor", "ns2"))
	assert.False(t, e.CanEditNamespace("ns1Editor", "ns2"))
	assert.False(t, e.CanManageNamespace("ns1Editor", "ns2"))

	assert.True(t, e.CanViewNamespace("ns1Owner", "ns1"))
	assert.True(t, e.CanEditNamespace("ns1Owner", "ns1"))
	assert.True(t, e.CanManageNamespace("ns1Owner", "ns1"))
	assert.False(t, e.CanViewNamespace("ns1Owner", "ns2"))
	assert.False(t, e.CanEditNamespace("ns1Owner", "ns2"))
	assert.False(t, e.CanManageNamespace("ns1Owner", "ns2"))

	assert.True(t, e.CanViewNamespace("clusterViewer", "ns1"))
	assert.False(t, e.CanEditNamespace("clusterViewer", "ns1"))
	assert.False(t, e.CanManageNamespace("clusterViewer", "ns1"))
	assert.True(t, e.CanViewNamespace("clusterViewer", "ns2"))
	assert.False(t, e.CanEditNamespace("clusterViewer", "ns2"))
	assert.False(t, e.CanManageNamespace("clusterViewer", "ns2"))

	assert.True(t, e.CanViewNamespace("clusterEditor", "ns1"))
	assert.True(t, e.CanEditNamespace("clusterEditor", "ns1"))
	assert.False(t, e.CanManageNamespace("clusterEditor", "ns1"))
	assert.True(t, e.CanViewNamespace("clusterEditor", "ns2"))
	assert.True(t, e.CanEditNamespace("clusterEditor", "ns2"))
	assert.False(t, e.CanManageNamespace("clusterEditor", "ns2"))

	assert.True(t, e.CanViewNamespace("clusterOwner", "ns1"))
	assert.True(t, e.CanEditNamespace("clusterOwner", "ns1"))
	assert.True(t, e.CanManageNamespace("clusterOwner", "ns1"))
	assert.True(t, e.CanViewNamespace("clusterOwner", "ns2"))
	assert.True(t, e.CanEditNamespace("clusterOwner", "ns2"))
	assert.True(t, e.CanManageNamespace("clusterOwner", "ns2"))

	// Special case
	assert.True(t, e.Can("Nio", "edit", "ns2", "components/abc"))
	assert.False(t, e.Can("Nio", "edit", "ns2", "pod/abc"))
}
