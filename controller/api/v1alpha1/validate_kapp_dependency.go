package v1alpha1

import (
	"container/list"
	"fmt"
)

// 1. check if there is any loop in dependency graph
//func isValidateDependency(spec ComponentSpec) KappValidateErrorList {
//	//spec := app.Spec
//
//	// build graph
//	nodeMap := buildDependencyGraph(spec)
//	loopExist, nodesInLoop := bfsCheckIfLoopExist(nodeMap)
//
//	if !loopExist {
//		return nil
//	}
//
//	var errs []KappValidateError
//	for _, node := range nodesInLoop {
//		errs = append(errs, KappValidateError{
//			Err:  "dependency loop exist",
//			Path: getJsonPathOfWrongField(node.Name, spec),
//		})
//	}
//
//	return errs
//}

//func getJsonPathOfWrongField(name string, spec ApplicationSpec) string {
//	idx := idxOfComponent(name, spec)
//
//	return fmt.Sprintf(".components[%d].dependencies", idx)
//}
//
//func idxOfComponent(componentName string, spec ApplicationSpec) int {
//	for i := range spec.Components {
//		if componentName == spec.Components[i].Name {
//			return i
//		}
//	}
//
//	return -1
//}

// componentName -> node
func buildDependencyGraph(component Component) map[string]*node {
	var nodeMap = make(map[string]*node)
	//for _, component := range spec.Components {

	if _, exist := nodeMap[component.Name]; !exist {
		nodeMap[component.Name] = &node{
			Name: component.Name,
		}
	}
	curNode := nodeMap[component.Name]

	for _, dep := range component.Spec.Dependencies {
		if _, exist := nodeMap[dep]; !exist {
			nodeMap[dep] = &node{
				Name: dep,
			}
		}

		nodeMap[dep].Refed = append(nodeMap[dep].Refed, curNode)
		//fmt.Println("> node:", dep, "refedBy:", nodeMap[dep].Refed[0])
	}

	//fmt.Println("node in depGraph:", component.Name, "dependOn:", component.Dependencies)
	//}

	//fmt.Println("graph size:", len(nodeMap))
	return nodeMap
}

func bfsCheckIfLoopExist(nodeMap map[string]*node) (bool, []*node) {
	// bfs
	var queue = list.New()
	for _, v := range nodeMap {
		if len(v.Refed) <= 0 {
			queue.PushBack(v)
		}
	}

	for queue.Len() > 0 {
		size := queue.Len()
		fmt.Println("queue size of 0-degree nodes:", size)

		for i := 0; i < size; i++ {
			curEle := queue.Front()
			queue.Remove(curEle)

			curNode := curEle.Value.(*node)
			for _, n := range nodeMap {
				if existNode(n.Refed, curNode) {
					n.Refed = removeFromSlice(n.Refed, curNode)
				}
			}

			//delete this node from map
			delete(nodeMap, curNode.Name)
		}

		fmt.Println("map size after rm 0-inDegree nodes:", len(nodeMap))

		// recheck in-degree zero nodes
		for _, v := range nodeMap {
			fmt.Println("leftNode:", v)

			if len(v.Refed) <= 0 {
				queue.PushBack(v)
			}
		}
	}

	loopExist := len(nodeMap) > 0

	var nodesInLoop []*node
	for _, node := range nodeMap {
		nodesInLoop = append(nodesInLoop, node)
	}

	return loopExist, nodesInLoop
}

func existNode(slice []*node, target *node) bool {
	for _, node := range slice {
		if node == target {
			return true
		}
	}

	return false
}

func removeFromSlice(slice []*node, target *node) []*node {
	for i := 0; i < len(slice); i++ {
		if slice[i] == target {
			// overwrite by head, and remove without head
			slice[i] = slice[0]
			slice = slice[1:]

			return slice
		}
	}

	return slice
}

type node struct {
	Name  string
	Refed []*node
}
