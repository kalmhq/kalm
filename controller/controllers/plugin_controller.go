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
	"github.com/kapp-staging/kapp/util"
	"github.com/kapp-staging/kapp/vm"
	"github.com/xeipuuv/gojsonschema"
	"k8s.io/apimachinery/pkg/api/errors"
	"sync"

	"github.com/go-logr/logr"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	corev1alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
)

type PluginMethod = string

const (
	PluginMethodComponentFilter PluginMethod = "ComponentFilter"

	PluginMethodAfterPodTemplateGeneration PluginMethod = "AfterPodTemplateGeneration"
	PluginMethodBeforeDeploymentSave       PluginMethod = "BeforeDeploymentSave"
	PluginMethodBeforeServiceSave          PluginMethod = "BeforeServiceSave"
	PluginMethodBeforeCronjobSave          PluginMethod = "BeforeCronjobSave"
)

var ValidPluginMethods = []PluginMethod{
	PluginMethodComponentFilter,
	PluginMethodAfterPodTemplateGeneration,
	PluginMethodBeforeDeploymentSave,
	PluginMethodBeforeServiceSave,
	PluginMethodBeforeCronjobSave,
}

var pluginsCache *PluginsCache

type PluginProgram struct {
	*js.Program

	Name string

	ConfigSchema *gojsonschema.Schema

	// a map of defined hooks
	Methods map[string]bool

	AvailableForAllWorkloadTypes bool
	AvailableWorkloadTypes       map[corev1alpha1.WorkloadType]bool
}

type PluginsCache struct {
	mut      sync.RWMutex
	Programs map[string]*PluginProgram
}

func (c *PluginsCache) Set(name string, program *PluginProgram) {
	c.mut.Lock()
	defer c.mut.Unlock()
	c.Programs[name] = program
}

func (c *PluginsCache) Get(name string) *PluginProgram {
	c.mut.RLock()
	defer c.mut.RUnlock()
	return c.Programs[name]
}

func (c *PluginsCache) Delete(name string) {
	c.mut.Lock()
	defer c.mut.Unlock()
	delete(c.Programs, name)
}

func init() {
	pluginsCache = &PluginsCache{
		mut:      sync.RWMutex{},
		Programs: make(map[string]*PluginProgram),
	}
}

// PluginReconciler reconciles a Plugin object
type PluginReconciler struct {
	client.Client
	Log    logr.Logger
	Scheme *runtime.Scheme
	Reader client.Reader
}

// +kubebuilder:rbac:groups=core.kapp.dev,resources=plugins,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=plugins/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=core.kapp.dev,resources=pluginbindings,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=pluginbindings/status,verbs=get;update;patch

func (r *PluginReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	log := r.Log.WithValues("application", req.NamespacedName)
	ctx := context.Background()

	var plugin corev1alpha1.Plugin

	if err := r.Get(ctx, req.NamespacedName, &plugin); err != nil {
		err = client.IgnoreNotFound(err)

		if err != nil {
			log.Error(err, "unable to fetch Plugin")
		}

		return ctrl.Result{}, err
	}

	// handle delete
	if plugin.ObjectMeta.DeletionTimestamp.IsZero() {
		// add finalizer
		if !util.ContainsString(plugin.ObjectMeta.Finalizers, finalizerName) {
			plugin.ObjectMeta.Finalizers = append(plugin.ObjectMeta.Finalizers, finalizerName)
			err := r.Update(context.Background(), &plugin)
			return ctrl.Result{}, err
		}
	} else {
		// The object is being deleted
		if util.ContainsString(plugin.ObjectMeta.Finalizers, finalizerName) {
			pluginsCache.Delete(plugin.Name)

			if err := r.deletePluginBindings(ctx, &plugin, log); err != nil {
				return ctrl.Result{}, err
			}

			// remove our finalizer from the list and update it.
			plugin.ObjectMeta.Finalizers = util.RemoveString(plugin.ObjectMeta.Finalizers, finalizerName)
			err := r.Update(ctx, &plugin)
			return ctrl.Result{}, err
		}

		return ctrl.Result{}, nil
	}

	var err error
	var program *js.Program
	if plugin.Spec.Src == "" {
		err = fmt.Errorf("Empty source")
	} else {
		program, err = vm.CompileProgram(plugin.Spec.Src)
	}

	// TODO create some events to explain details
	if plugin.Status.CompiledSuccessfully != (err == nil) {
		plugin.Status.CompiledSuccessfully = err == nil

		if err := r.Status().Update(ctx, &plugin); err != nil {
			if errors.IsConflict(err) {
				r.Log.Info("errors.IsConflict, retry later", "err", err)
				return ctrl.Result{}, nil
			}

			r.Log.Error(err, "fail to update plugin status")
			return ctrl.Result{}, err
		}
	}

	var configSchema *gojsonschema.Schema
	if plugin.Spec.ConfigSchema != nil {
		schemaLoader := gojsonschema.NewStringLoader(string(plugin.Spec.ConfigSchema.Raw))
		configSchema, err = gojsonschema.NewSchema(schemaLoader)

		if err != nil {
			log.Error(err, "compile plugin config schema error")
			return ctrl.Result{}, nil
		}
	}

	// The plugin must be compilable before move on
	if !plugin.Status.CompiledSuccessfully {
		return ctrl.Result{}, nil
	}

	methods, err := vm.GetDefinedMethods(plugin.Spec.Src, ValidPluginMethods)

	if err != nil {
		r.Log.Error(err, "Get Defined Methods error.")
		return ctrl.Result{}, nil
	}

	availableWorkloadTypes := make(map[corev1alpha1.WorkloadType]bool)
	var availableForAllWorkloadTypes bool

	if len(plugin.Spec.AvailableWorkloadType) == 0 {
		availableForAllWorkloadTypes = true
	} else {
		for _, workloadType := range plugin.Spec.AvailableWorkloadType {
			availableWorkloadTypes[workloadType] = true
		}
	}

	pluginsCache.Set(plugin.Name, &PluginProgram{
		Name:                         plugin.Name,
		Program:                      program,
		Methods:                      methods,
		AvailableForAllWorkloadTypes: availableForAllWorkloadTypes,
		AvailableWorkloadTypes:       availableWorkloadTypes,
		ConfigSchema:                 configSchema,
	})

	return ctrl.Result{}, nil
}

func (r *PluginReconciler) deletePluginBindings(ctx context.Context, plugin *corev1alpha1.Plugin, log logr.Logger) error {
	var bindingList corev1alpha1.PluginBindingList

	if err := r.Reader.List(ctx, &bindingList, client.MatchingLabels{
		"kapp-plugin": plugin.Name,
	}); err != nil {
		log.Error(err, "get plugin binding list error.")
		return err
	}

	for _, binding := range bindingList.Items {
		if err := r.Delete(ctx, &binding); err != nil {
			log.Error(err, "Delete plugin binding error.")
		}
	}

	return nil
}

func (r *PluginReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.Plugin{}).
		Complete(r)
}
