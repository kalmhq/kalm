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
	js "github.com/dop251/goja"
	"github.com/kapp-staging/kapp/controller/utils"
	"github.com/kapp-staging/kapp/controller/vm"
	"github.com/xeipuuv/gojsonschema"
	"k8s.io/apimachinery/pkg/api/errors"
	"sync"

	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	corev1alpha1 "github.com/kapp-staging/kapp/controller/api/v1alpha1"
)

type ApplicationPluginMethod = string

const (
	ApplicationPluginMethodAfterApplicationSaved ApplicationPluginMethod = "AfterApplicationSaved"
	ApplicationPluginMethodBeforeApplicationSave ApplicationPluginMethod = "BeforeApplicationSave"
)

var ValidApplicationPluginMethods = []ApplicationPluginMethod{
	ApplicationPluginMethodAfterApplicationSaved,
	ApplicationPluginMethodBeforeApplicationSave,
}

var applicationPluginsCache *ApplicationPluginsCache

type ApplicationPluginProgram struct {
	*js.Program

	Name string

	ConfigSchema *gojsonschema.Schema

	// a map of defined hooks
	Methods map[string]bool
}

type ApplicationPluginsCache struct {
	mut      sync.RWMutex
	Programs map[string]*ApplicationPluginProgram
}

func (c *ApplicationPluginsCache) Set(name string, program *ApplicationPluginProgram) {
	c.mut.Lock()
	defer c.mut.Unlock()
	c.Programs[name] = program
}

func (c *ApplicationPluginsCache) Get(name string) *ApplicationPluginProgram {
	c.mut.RLock()
	defer c.mut.RUnlock()
	return c.Programs[name]
}

func (c *ApplicationPluginsCache) Delete(name string) {
	c.mut.Lock()
	defer c.mut.Unlock()
	delete(c.Programs, name)
}

func init() {
	applicationPluginsCache = &ApplicationPluginsCache{
		mut:      sync.RWMutex{},
		Programs: make(map[string]*ApplicationPluginProgram),
	}
}

// ApplicationPluginReconciler reconciles a ApplicationPlugin object
type ApplicationPluginReconciler struct {
	*BaseReconciler
}

// +kubebuilder:rbac:groups=core.kapp.dev,resources=applicationplugins,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=applicationplugins/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=core.kapp.dev,resources=applicationpluginbindings,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=applicationpluginbindings/status,verbs=get;update;patch

func (r *ApplicationPluginReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	task := &ApplicationPluginReconcilerTask{
		ApplicationPluginReconciler: r,
		ctx:                         context.Background(),
	}

	return ctrl.Result{}, task.Run(req)
}

type ApplicationPluginReconcilerTask struct {
	*ApplicationPluginReconciler
	ctx    context.Context
	plugin *corev1alpha1.ApplicationPlugin
}

func (r *ApplicationPluginReconcilerTask) Run(req ctrl.Request) error {
	var plugin corev1alpha1.ApplicationPlugin

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
			applicationPluginsCache.Delete(r.plugin.Name)

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
		r.WarningEvent(err, "application plugin compile error.")
	}

	if r.plugin.Status.CompiledSuccessfully != (err == nil) {
		r.plugin.Status.CompiledSuccessfully = err == nil

		if err := r.Status().Update(r.ctx, r.plugin); err != nil {
			if errors.IsConflict(err) {
				r.NormalEvent("Conflict", "errors.IsConflict, retry later")
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

	if !r.plugin.Status.CompiledSuccessfully {
		return nil
	}

	methods, err := vm.GetDefinedMethods(r.plugin.Spec.Src, ValidApplicationPluginMethods)

	if err != nil {
		r.WarningEvent(err, "Get Defined Methods error.")
		return nil
	}

	applicationPluginsCache.Set(r.plugin.Name, &ApplicationPluginProgram{
		Name:         r.plugin.Name,
		Program:      program,
		Methods:      methods,
		ConfigSchema: configSchema,
	})

	return nil
}

func (r *ApplicationPluginReconcilerTask) deletePluginBindings() error {
	var bindingList corev1alpha1.ApplicationPluginBindingList

	if err := r.Reader.List(r.ctx, &bindingList, client.MatchingLabels{
		"kapp-plugin": r.plugin.Name,
	}); err != nil {
		r.WarningEvent(err, "get plugin binding list error.")
		return err
	}

	for _, binding := range bindingList.Items {
		if err := r.Delete(r.ctx, &binding); err != nil {
			r.WarningEvent(err, "Delete plugin binding error.")
		}
	}

	return nil
}

func (r *ApplicationPluginReconcilerTask) WarningEvent(err error, msg string, args ...interface{}) {
	r.EmitWarningEvent(r.plugin, err, msg, args...)
}

func (r *ApplicationPluginReconcilerTask) NormalEvent(reason, msg string, args ...interface{}) {
	r.EmitNormalEvent(r.plugin, reason, msg, args...)
}

func NewApplicationPluginReconciler(mgr ctrl.Manager) *ApplicationPluginReconciler {
	return &ApplicationPluginReconciler{
		NewBaseReconciler(mgr, "ApplicationPlugin"),
	}
}

func (r *ApplicationPluginReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.ApplicationPlugin{}).
		Complete(r)
}
