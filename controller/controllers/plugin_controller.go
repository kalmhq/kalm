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
	"k8s.io/apimachinery/pkg/api/errors"
	"sync"

	"github.com/go-logr/logr"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	corev1alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
)

var pluginsCache *PluginsCache

type PluginsCache struct {
	mut      sync.RWMutex
	Programs map[string]*js.Program
}

func (c *PluginsCache) Set(name string, program *js.Program) {
	c.mut.Lock()
	defer c.mut.Unlock()
	c.Programs[name] = program
}

func (c *PluginsCache) Get(name string) *js.Program {
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
		Programs: make(map[string]*js.Program),
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

	cacheKeyName := fmt.Sprintf("%s/%s", plugin.GroupVersionKind(), plugin.Name)

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
			pluginsCache.Delete(cacheKeyName)
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

	if plugin.Status.CompiledSuccessfully {
		pluginsCache.Set(cacheKeyName, program)
	}

	return ctrl.Result{}, nil
}

func (r *PluginReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.Plugin{}).
		Complete(r)
}
