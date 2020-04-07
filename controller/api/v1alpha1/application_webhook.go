/*

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package v1alpha1

import (
	"container/list"
	"fmt"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	logf "sigs.k8s.io/controller-runtime/pkg/runtime/log"
	"sigs.k8s.io/controller-runtime/pkg/webhook"
)

// log is for logging in this package.
var applicationlog = logf.Log.WithName("application-resource")

func (r *Application) SetupWebhookWithManager(mgr ctrl.Manager) error {
	return ctrl.NewWebhookManagedBy(mgr).
		For(r).
		Complete()
}

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!

// kubebuilder:webhook:path=/mutate-core-kapp-dev-v1alpha1-application,mutating=true,failurePolicy=fail,groups=core.kapp.dev,resources=applications,verbs=create;update,versions=v1alpha1,name=mapplication.kb.io

var _ webhook.Defaulter = &Application{}

// Default implements webhook.Defaulter so a webhook will be registered for the type
func (r *Application) Default() {
	applicationlog.Info("default", "name", r.Name)

	// TODO(user): fill in your defaulting logic.
}

// TODO(user): change verbs to "verbs=create;update;delete" if you want to enable deletion validation.
// kubebuilder:webhook:verbs=create;update,path=/validate-core-kapp-dev-v1alpha1-application,mutating=false,failurePolicy=fail,groups=core.kapp.dev,resources=applications,versions=v1alpha1,name=vapplication.kb.io

var _ webhook.Validator = &Application{}

// ValidateCreate implements webhook.Validator so a webhook will be registered for the type
func (r *Application) ValidateCreate() error {
	applicationlog.Info("validate create", "name", r.Name)

	return r.validateApplication()
}

// ValidateUpdate implements webhook.Validator so a webhook will be registered for the type
func (r *Application) ValidateUpdate(old runtime.Object) error {
	applicationlog.Info("validate update", "name", r.Name)

	return r.validateApplication()
}

// ValidateDelete implements webhook.Validator so a webhook will be registered for the type
func (r *Application) ValidateDelete() error {
	applicationlog.Info("validate delete", "name", r.Name)

	// TODO(user): fill in your validation logic upon object deletion.
	return nil
}

func (r *Application) validateApplication() error {

	// for now only check dependency here
	if err := r.validateDependency(); err != nil {
		return err
	}

	return nil
}

// 1. check if there is any loop in dependency graph
func (r *Application) validateDependency() error {

	// build graph
	nodeMap := buildDependencyGraph(r.Spec)
	loopExist := bfsCheckIfLoopExist(nodeMap)

	if loopExist {
		return fmt.Errorf("dependency loop exist")
	}

	return nil
}

func buildDependencyGraph(spec ApplicationSpec) map[string]*node {
	var nodeMap = make(map[string]*node)
	for _, component := range spec.Components {
		curNode := &node{
			Name: component.Name,
		}

		nodeMap[curNode.Name] = curNode

		for _, dep := range component.Dependencies {
			if _, exist := nodeMap[dep]; !exist {
				nodeMap[dep] = &node{
					Name: dep,
				}
			}

			nodeMap[dep].Refed = append(nodeMap[dep].Refed, curNode)
		}
	}

	return nodeMap
}

func bfsCheckIfLoopExist(nodeMap map[string]*node) bool {
	// bfs
	var queue = list.New()
	for _, v := range nodeMap {
		if len(v.Refed) <= 0 {
			queue.PushBack(v)
		}
	}

	for queue.Len() > 0 {
		size := queue.Len()
		fmt.Println("size:", size)

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
	return loopExist
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
