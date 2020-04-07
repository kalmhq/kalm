package v1alpha1

import (
	"fmt"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestRemoveFromSlice(t *testing.T) {
	slice := []*node{
		&node{Name: "1"},
		&node{Name: "2"},
		&node{Name: "3"},
	}

	fmt.Println(slice)
	slice = removeFromSlice(slice, slice[2])
	fmt.Println(slice)

	slice = removeFromSlice(slice, slice[0])
	fmt.Println(slice)
}

func TestSlice(t *testing.T) {
	slice := []int{1, 2, 3}
	fmt.Println(slice)
	change(slice)
	fmt.Println(slice)
}

func change(slice []int) {
	slice[0] = slice[1]
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

	loopExist := bfsCheckIfLoopExist(nodeMap)
	assert.False(t, loopExist)
}

func TestCheckLoopExist(t *testing.T) {
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

	loopExist := bfsCheckIfLoopExist(nodeMap)
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

	loopExist := bfsCheckIfLoopExist(nodeMap)
	assert.True(t, loopExist)
}
