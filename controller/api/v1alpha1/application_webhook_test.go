package v1alpha1

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestRemoveFromSlice(t *testing.T) {
	slice := []*node{
		{Name: "1"},
		{Name: "2"},
		{Name: "3"},
	}

	slice = removeFromSlice(slice, slice[2])
	assert.Len(t, slice, 2)
	assert.Equal(t, "2", slice[0].Name)
	assert.Equal(t, "1", slice[1].Name)

	slice = removeFromSlice(slice, slice[0])
	assert.Len(t, slice, 1)
	assert.Equal(t, "1", slice[0].Name)
}

func TestCheckLoop(t *testing.T) {
	a := &node{Name: "a"}
	b := &node{Name: "b"}
	c := &node{Name: "c"}

	c.Refed = append(c.Refed, a)
	c.Refed = append(c.Refed, b)

	nodeMap := make(map[string]*node)
	nodeMap[a.Name] = a
	nodeMap[b.Name] = b
	nodeMap[c.Name] = c

	loopExist, _ := bfsCheckIfLoopExist(nodeMap)
	assert.False(t, loopExist)
}

func TestCheckLoopExist(t *testing.T) {
	a := &node{Name: "a"}
	b := &node{Name: "b"}

	a.Refed = []*node{b}
	b.Refed = []*node{a}

	nodeMap := make(map[string]*node)
	nodeMap[a.Name] = a
	nodeMap[b.Name] = b

	loopExist, _ := bfsCheckIfLoopExist(nodeMap)
	assert.True(t, loopExist)
}

func TestCheckLoopExist1(t *testing.T) {
	a := &node{Name: "a"}
	b := &node{Name: "b"}
	c := &node{Name: "c"}

	c.Refed = []*node{a}
	a.Refed = []*node{b}
	b.Refed = []*node{c}

	nodeMap := make(map[string]*node)
	nodeMap[a.Name] = a
	nodeMap[b.Name] = b
	nodeMap[c.Name] = c

	loopExist, _ := bfsCheckIfLoopExist(nodeMap)
	assert.True(t, loopExist)
}

func TestCheckLoopExist2(t *testing.T) {
	a := &node{Name: "a"}
	b := &node{Name: "b"}
	c := &node{Name: "c"}

	b.Refed = []*node{a, c}
	c.Refed = []*node{b}

	nodeMap := make(map[string]*node)
	nodeMap[a.Name] = a
	nodeMap[b.Name] = b
	nodeMap[c.Name] = c

	loopExist, _ := bfsCheckIfLoopExist(nodeMap)
	assert.True(t, loopExist)
}
