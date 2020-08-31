package rbac

import (
	"github.com/casbin/casbin/v2"
	"github.com/casbin/casbin/v2/model"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestCasbinModel(t *testing.T) {
	mod, err := model.NewModelFromString(rbacWithAdminModel)
	assert.Nil(t, err)

	e, err := casbin.NewEnforcer(mod, NewStringPolicyAdapter(`
p, alice, view, ns1, data1
p, bob, edit, ns1, data2

p, ns1Viewer, view, ns1, *
p, ns1Editor, edit, ns1, *

g, ns1Owner, ns1Viewer
g, ns1Owner, ns1Editor

p, ns2Viewer, view, ns2, *
p, ns2Editor, edit, ns2, *

g, ns2Owner, ns2Viewer
g, ns2Owner, ns2Editor

p, clusterViewer, view, *, *
p, clusterEditor, edit, *, *

g, clusterOwner, clusterViewer
g, clusterOwner, clusterEditor

g, david, ns1Owner
p, david, view, ns2, components/specific-prefix-*
g, dvd, clusterOwner
`))

	assert.Nil(t, err)
	assert.NotNil(t, e)

	e.AddFunction("objMatchFunc", objMatchFunc)

	var canAccess bool

	canAccess, err = e.Enforce("alice", "view", "ns1", "data1")
	assert.Nil(t, err)
	assert.True(t, canAccess)

	canAccess, err = e.Enforce("alice", "view", "ns1", "data3")
	assert.Nil(t, err)
	assert.False(t, canAccess)

	canAccess, err = e.Enforce("alice", "delete", "ns1", "data2")
	assert.Nil(t, err)
	assert.False(t, canAccess)

	canAccess, err = e.Enforce("bob", "edit", "ns1", "data2")
	assert.Nil(t, err)
	assert.True(t, canAccess)

	canAccess, err = e.Enforce("david", "edit", "ns1", "data2")
	assert.Nil(t, err)
	assert.True(t, canAccess)

	canAccess, err = e.Enforce("david", "view", "ns1", "anotherData")
	assert.Nil(t, err)
	assert.True(t, canAccess)

	canAccess, err = e.Enforce("david", "edit", "ns2", "data2")
	assert.Nil(t, err)
	assert.False(t, canAccess)

	canAccess, err = e.Enforce("david", "view", "ns2", "components/specific-prefix-123")
	assert.Nil(t, err)
	assert.True(t, canAccess)

	canAccess, err = e.Enforce("dvd", "edit", "anyNS", "anyData")
	assert.Nil(t, err)
	assert.True(t, canAccess)
}
