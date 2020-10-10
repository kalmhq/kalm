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

package controllers

import (
	"context"
	"fmt"
	"sync"

	js "github.com/dop251/goja"
	"github.com/kalmhq/kalm/controller/utils"
	"github.com/kalmhq/kalm/controller/vm"
	"github.com/xeipuuv/gojsonschema"
	"k8s.io/apimachinery/pkg/api/errors"

	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	corev1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
)

type ComponentPluginMethod = string

const (
	ComponentPluginMethodComponentFilter ComponentPluginMethod = "ComponentFilter"

	ComponentPluginMethodAfterPodTemplateGeneration ComponentPluginMethod = "AfterPodTemplateGeneration"
	ComponentPluginMethodBeforeDeploymentSave       ComponentPluginMethod = "BeforeDeploymentSave"
	ComponentPluginMethodBeforeServiceSave          ComponentPluginMethod = "BeforeServiceSave"
	ComponentPluginMethodBeforeCronjobSave          ComponentPluginMethod = "BeforeCronjobSave"
)

var ValidPluginMethods = []ComponentPluginMethod{
	ComponentPluginMethodComponentFilter,
	ComponentPluginMethodAfterPodTemplateGeneration,
	ComponentPluginMethodBeforeDeploymentSave,
	ComponentPluginMethodBeforeServiceSave,
	ComponentPluginMethodBeforeCronjobSave,
}

var componentPluginsCache *ComponentPluginsCache

type ComponentPluginProgram struct {
	*js.Program

	Name string

	ConfigSchema *gojsonschema.Schema

	// a map of defined hooks
	Methods map[string]bool

	AvailableForAllWorkloadTypes bool
	AvailableWorkloadTypes       map[corev1alpha1.WorkloadType]bool
}

type ComponentPluginsCache struct {
	mut      sync.RWMutex
	Programs map[string]*ComponentPluginProgram
}

func (c *ComponentPluginsCache) Set(name string, program *ComponentPluginProgram) {
	c.mut.Lock()
	defer c.mut.Unlock()
	c.Programs[name] = program
}

func (c *ComponentPluginsCache) Get(name string) *ComponentPluginProgram {
	c.mut.RLock()
	defer c.mut.RUnlock()
	return c.Programs[name]
}

func (c *ComponentPluginsCache) Delete(name string) {
	c.mut.Lock()
	defer c.mut.Unlock()
	delete(c.Programs, name)
}

func init() {
	componentPluginsCache = &ComponentPluginsCache{
		mut:      sync.RWMutex{},
		Programs: make(map[string]*ComponentPluginProgram),
	}
}

// ComponentPluginReconciler reconciles a ComponentPlugin object
type ComponentPluginReconciler struct {
	*BaseReconciler
}

// +kubebuilder:rbac:groups=core.kalm.dev,resources=componentplugins,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kalm.dev,resources=componentplugins/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=core.kalm.dev,resources=componentpluginbindings,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kalm.dev,resources=componentpluginbindings/status,verbs=get;update;patch

func (r *ComponentPluginReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	task := &ComponentPluginReconcilerTask{
		ComponentPluginReconciler: r,
		ctx:                       context.Background(),
	}

	return ctrl.Result{}, task.Run(req)
}

func (r *ComponentPluginReconcilerTask) Run(req ctrl.Request) error {
	var plugin corev1alpha1.ComponentPlugin

	if err := r.Get(r.ctx, req.NamespacedName, &plugin); err != nil {
		return client.IgnoreNotFound(err)
	}

	r.plugin = &plugin

	// handle delete
	if r.plugin.ObjectMeta.DeletionTimestamp.IsZero() {
		// add finalizer
		if !utils.ContainsString(r.plugin.ObjectMeta.Finalizers, finalizerName) {
			r.plugin.ObjectMeta.Finalizers = append(r.plugin.ObjectMeta.Finalizers, finalizerName)
			err := r.Update(context.Background(), r.plugin)
			return err
		}
	} else {
		// The object is being deleted
		if utils.ContainsString(r.plugin.ObjectMeta.Finalizers, finalizerName) {
			componentPluginsCache.Delete(r.plugin.Name)

			if err := r.deletePluginBindings(); err != nil {
				return err
			}

			// remove our finalizer from the list and update it.
			r.plugin.ObjectMeta.Finalizers = utils.RemoveString(r.plugin.ObjectMeta.Finalizers, finalizerName)
			err := r.Update(r.ctx, r.plugin)
			return err
		}

		return nil
	}

	var err error
	var program *js.Program
	if r.plugin.Spec.Src == "" {
		err = fmt.Errorf("Empty source")
	} else {
		program, err = vm.CompileProgram(r.plugin.Spec.Src)
	}

	if err != nil {
		r.WarningEvent(err, "component plugin compile error.")
	}

	// TODO create some events to explain details
	if r.plugin.Status.CompiledSuccessfully != (err == nil) {
		r.plugin.Status.CompiledSuccessfully = err == nil

		if err := r.Status().Update(r.ctx, r.plugin); err != nil {
			if errors.IsConflict(err) {
				r.NormalEvent("UpdateConflict", "errors.IsConflict, retry later")
				return nil
			}

			r.WarningEvent(err, "fail to update plugin status")
			return err
		}
	}

	var configSchema *gojsonschema.Schema
	if r.plugin.Spec.ConfigSchema != nil {
		schemaLoader := gojsonschema.NewStringLoader(string(r.plugin.Spec.ConfigSchema.Raw))
		configSchema, err = gojsonschema.NewSchema(schemaLoader)

		if err != nil {
			r.WarningEvent(err, "compile plugin config schema error")
			return nil
		}
	}

	// The plugin must be compilable before move on
	if !r.plugin.Status.CompiledSuccessfully {
		return nil
	}

	methods, err := vm.GetDefinedMethods(r.plugin.Spec.Src, ValidPluginMethods)

	if err != nil {
		r.WarningEvent(err, "Get Defined Methods error.")
		return nil
	}

	availableWorkloadTypes := make(map[corev1alpha1.WorkloadType]bool)
	var availableForAllWorkloadTypes bool

	if len(r.plugin.Spec.AvailableWorkloadType) == 0 {
		availableForAllWorkloadTypes = true
	} else {
		for _, workloadType := range r.plugin.Spec.AvailableWorkloadType {
			availableWorkloadTypes[workloadType] = true
		}
	}

	componentPluginsCache.Set(r.plugin.Name, &ComponentPluginProgram{
		Name:                         r.plugin.Name,
		Program:                      program,
		Methods:                      methods,
		AvailableForAllWorkloadTypes: availableForAllWorkloadTypes,
		AvailableWorkloadTypes:       availableWorkloadTypes,
		ConfigSchema:                 configSchema,
	})

	return nil
}

func (r *ComponentPluginReconcilerTask) deletePluginBindings() error {
	var bindingList corev1alpha1.ComponentPluginBindingList

	if err := r.Reader.List(r.ctx, &bindingList, client.MatchingLabels{
		"kalm-plugin": r.plugin.Name,
	}); err != nil {
		r.WarningEvent(err, "get plugin binding list error.")
		return err
	}

	for i := range bindingList.Items {
		binding := bindingList.Items[i]

		if err := r.Delete(r.ctx, &binding); err != nil {
			r.WarningEvent(err, "Delete plugin binding error.")
		}
	}

	return nil
}

type ComponentPluginReconcilerTask struct {
	*ComponentPluginReconciler
	ctx    context.Context
	plugin *corev1alpha1.ComponentPlugin
}

func (r *ComponentPluginReconcilerTask) WarningEvent(err error, msg string, args ...interface{}) {
	r.EmitWarningEvent(r.plugin, err, msg, args...)
}

func (r *ComponentPluginReconcilerTask) NormalEvent(reason, msg string, args ...interface{}) {
	r.EmitNormalEvent(r.plugin, reason, msg, args...)
}

func NewComponentPluginReconciler(mgr ctrl.Manager) *ComponentPluginReconciler {
	return &ComponentPluginReconciler{
		NewBaseReconciler(mgr, "ComponentPlugin"),
	}
}

func (r *ComponentPluginReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.ComponentPlugin{}).
		Complete(r)
}
