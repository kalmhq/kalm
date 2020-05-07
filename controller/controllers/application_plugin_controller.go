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
	"github.com/kapp-staging/kapp/utils"
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
	client.Client
	Log    logr.Logger
	Scheme *runtime.Scheme
	Reader client.Reader
}

// +kubebuilder:rbac:groups=core.kapp.dev,resources=applicationplugins,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=applicationplugins/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=core.kapp.dev,resources=applicationpluginbindings,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=applicationpluginbindings/status,verbs=get;update;patch

func (r *ApplicationPluginReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	log := r.Log.WithValues("applicationPlugin", req.NamespacedName)
	ctx := context.Background()

	var plugin corev1alpha1.ApplicationPlugin

	if err := r.Get(ctx, req.NamespacedName, &plugin); err != nil {
		err = client.IgnoreNotFound(err)

		if err != nil {
			log.Error(err, "unable to fetch ApplicationPlugin")
		}

		return ctrl.Result{}, err
	}

	// handle delete
	if plugin.ObjectMeta.DeletionTimestamp.IsZero() {
		// add finalizer
		if !utils.ContainsString(plugin.ObjectMeta.Finalizers, finalizerName) {
			plugin.ObjectMeta.Finalizers = append(plugin.ObjectMeta.Finalizers, finalizerName)
			err := r.Update(context.Background(), &plugin)
			return ctrl.Result{}, err
		}
	} else {
		// The object is being deleted
		if utils.ContainsString(plugin.ObjectMeta.Finalizers, finalizerName) {
			applicationPluginsCache.Delete(plugin.Name)

			if err := r.deletePluginBindings(ctx, &plugin, log); err != nil {
				return ctrl.Result{}, err
			}

			// remove our finalizer from the list and update it.
			plugin.ObjectMeta.Finalizers = utils.RemoveString(plugin.ObjectMeta.Finalizers, finalizerName)
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

	if err != nil {
		log.Error(err, "application plugin compile error.")
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

	methods, err := vm.GetDefinedMethods(plugin.Spec.Src, ValidApplicationPluginMethods)

	if err != nil {
		r.Log.Error(err, "Get Defined Methods error.")
		return ctrl.Result{}, nil
	}

	applicationPluginsCache.Set(plugin.Name, &ApplicationPluginProgram{
		Name:         plugin.Name,
		Program:      program,
		Methods:      methods,
		ConfigSchema: configSchema,
	})

	return ctrl.Result{}, nil
}

func (r *ApplicationPluginReconciler) deletePluginBindings(ctx context.Context, plugin *corev1alpha1.ApplicationPlugin, log logr.Logger) error {
	var bindingList corev1alpha1.ApplicationPluginBindingList

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

func (r *ApplicationPluginReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.ApplicationPlugin{}).
		Complete(r)
}
