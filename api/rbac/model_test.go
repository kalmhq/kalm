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
p, alice, view, tenant1/ns1, dataType1/*
p, bob, edit, tenant1/ns1, dataType2/*

p, ns1Viewer, view, tenant1/ns1, */*
p, ns1Editor, edit, tenant1/ns1, */*

g, ns1Owner, ns1Viewer
g, ns1Owner, ns1Editor

p, ns2Viewer, view, tenant1/ns2, */*
p, ns2Editor, edit, tenant1/ns2, */*

g, ns2Owner, ns2Viewer
g, ns2Owner, ns2Editor

p, clusterViewer, view, */*, */*
p, clusterEditor, edit, */*, */*

g, clusterOwner, clusterViewer
g, clusterOwner, clusterEditor

g, david, ns1Owner
p, david, view, tenant1/ns2, components/specific-prefix-*
g, dvd, clusterOwner
`))

	assert.Nil(t, err)
	assert.NotNil(t, e)

	e.AddFunction("objectMatchFunc", objectMatchFunc)

	var canAccess bool

	canAccess, err = e.Enforce("alice", "view", "tenant1/ns1", "dataType1/*")
	assert.Nil(t, err)
	assert.True(t, canAccess)

	canAccess, err = e.Enforce("alice", "view", "tenant1/ns1", "dataType3/*")
	assert.Nil(t, err)
	assert.False(t, canAccess)

	canAccess, err = e.Enforce("alice", "delete", "tenant1/ns1", "dataType2/*")
	assert.Nil(t, err)
	assert.False(t, canAccess)

	canAccess, err = e.Enforce("bob", "edit", "tenant1/ns1", "dataType2/*")
	assert.Nil(t, err)
	assert.True(t, canAccess)

	canAccess, err = e.Enforce("david", "edit", "tenant1/ns1", "dataType2/*")
	assert.Nil(t, err)
	assert.True(t, canAccess)

	canAccess, err = e.Enforce("david", "view", "tenant1/ns1", "anotherDataType/*")
	assert.Nil(t, err)
	assert.True(t, canAccess)

	canAccess, err = e.Enforce("david", "edit", "tenant1/ns2", "ataType2/*")
	assert.Nil(t, err)
	assert.False(t, canAccess)

	canAccess, err = e.Enforce("david", "view", "tenant1/ns2", "components/specific-prefix-123")
	assert.Nil(t, err)
	assert.True(t, canAccess)

	canAccess, err = e.Enforce("david", "view", "tenant1/ns3", "components/specific-prefix-123")
	assert.Nil(t, err)
	assert.False(t, canAccess)

	canAccess, err = e.Enforce("dvd", "edit", "tenant1/anyNS", "anyData/*")
	assert.Nil(t, err)
	assert.True(t, canAccess)
}
