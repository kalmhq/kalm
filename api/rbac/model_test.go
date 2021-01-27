package rbac

import (
	"testing"

	"github.com/casbin/casbin/v2"
	"github.com/casbin/casbin/v2/model"
	"github.com/stretchr/testify/assert"
)

func TestCasbinModel(t *testing.T) {
	mod, err := model.NewModelFromString(RBACModelString)
	assert.Nil(t, err)

	e, err := casbin.NewEnforcer(mod, NewStringPolicyAdapter(`
p, alice, view, ns1, *
p, bob, edit, ns1, *

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
p, david, view, ns2, specific-prefix-*
g, dvd, clusterOwner
g, dvd2, clusterViewer
`))

	assert.Nil(t, err)
	assert.NotNil(t, e)

	e.AddFunction("objectMatchFunc", objectMatchFunc)

	var canAccess bool

	canAccess, err = e.Enforce("alice", "view", "ns1", "*")
	assert.Nil(t, err)
	assert.True(t, canAccess)

	canAccess, err = e.Enforce("alice", "delete", "ns1", "*")
	assert.Nil(t, err)
	assert.False(t, canAccess)

	canAccess, err = e.Enforce("bob", "edit", "ns1", "*")
	assert.Nil(t, err)
	assert.True(t, canAccess)

	canAccess, err = e.Enforce("david", "edit", "ns1", "*")
	assert.Nil(t, err)
	assert.True(t, canAccess)

	canAccess, err = e.Enforce("david", "view", "ns1", "*")
	assert.Nil(t, err)
	assert.True(t, canAccess)

	canAccess, err = e.Enforce("david", "edit", "ns2", "*")
	assert.Nil(t, err)
	assert.False(t, canAccess)

	canAccess, err = e.Enforce("david", "view", "ns2", "specific-prefix-123")
	assert.Nil(t, err)
	assert.True(t, canAccess)

	canAccess, err = e.Enforce("david", "view", "ns3", "specific-prefix-123")
	assert.Nil(t, err)
	assert.False(t, canAccess)

	canAccess, err = e.Enforce("dvd2", "view", "*", "*")
	assert.Nil(t, err)
	assert.True(t, canAccess)
}
