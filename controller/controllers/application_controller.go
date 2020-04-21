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
	"github.com/go-logr/logr"
	corev1alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
	"github.com/kapp-staging/kapp/lib/files"
	"github.com/kapp-staging/kapp/util"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"time"
)

// ApplicationReconciler reconciles a Application object
type ApplicationReconciler struct {
	client.Client
	Reader client.Reader
	Log    logr.Logger
	Scheme *runtime.Scheme

	// The following fields will be filled by calling SetupAttributes() function
	ctx         context.Context
	application *corev1alpha1.Application

	// resources
	namespace *coreV1.Namespace
}

var ownerKey = ".metadata.controller"
var apiGVStr = corev1alpha1.GroupVersion.String()
var finalizerName = "storage.finalizers.kapp.dev"

// +kubebuilder:rbac:groups=core.kapp.dev,resources=applications,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=applications/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=,resources=namespaces,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=,resources=configmaps,verbs=get;list;watch;create;update;patch;delete

func (r *ApplicationReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	r.ctx = context.Background()
	r.Log = r.Log.WithValues("application", req.NamespacedName)
	r.Log.Info("=========== start reconciling ===========")
	defer r.Log.Info("=========== reconciling done ===========")

	var application corev1alpha1.Application

	if err := r.Reader.Get(r.ctx, req.NamespacedName, &application); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	r.application = &application

	if err := r.SetupAttributes(req); err != nil {
		return ctrl.Result{}, err
	}

	if err := r.LoadResources(); err != nil {
		return ctrl.Result{}, err
	}

	if err := r.HandleDelete(); err != nil {
		return ctrl.Result{}, err
	}

	if !r.application.ObjectMeta.DeletionTimestamp.IsZero() {
		return ctrl.Result{}, nil
	}

	if err := r.ReconcileNamespace(); err != nil {
		return ctrl.Result{}, err
	}

	if err := r.ReconcileComponents(); err != nil {
		return ctrl.Result{}, err
	}

	if err := r.ReconcileConfigMaps(); err != nil {
		return ctrl.Result{}, err
	}

	return ctrl.Result{}, nil
}

func (r *ApplicationReconciler) HandleDelete() (err error) {
	if r.application.ObjectMeta.DeletionTimestamp.IsZero() {
		if !util.ContainsString(r.application.ObjectMeta.Finalizers, finalizerName) {
			r.application.ObjectMeta.Finalizers = append(r.application.ObjectMeta.Finalizers, finalizerName)
			if err := r.Update(r.ctx, r.application); err != nil {
				return err
			}
			r.Log.Info("add finalizer", r.application.Namespace, r.application.Name)
		}
	} else {
		if util.ContainsString(r.application.ObjectMeta.Finalizers, finalizerName) {
			if r.namespace != nil {
				if err := r.Delete(r.ctx, r.namespace); err != nil {
					r.Log.Error(err, "Delete Namespace error.")
					return err
				}
			}

			r.application.ObjectMeta.Finalizers = util.RemoveString(r.application.ObjectMeta.Finalizers, finalizerName)
			if err := r.Update(r.ctx, r.application); err != nil {
				r.Log.Error(err, "Remove application finalizer failed.")
				return err
			}
		}
	}

	return nil
}

func (r *ApplicationReconciler) SetupAttributes(req ctrl.Request) (err error) {
	var application corev1alpha1.Application
	err = r.Reader.Get(r.ctx, req.NamespacedName, &application)

	if err != nil {
		err := client.IgnoreNotFound(err)

		if err != nil {
			r.Log.Error(err, "Get application error")
		}

		return err
	}

	r.application = &application
	return nil
}

func (r *ApplicationReconciler) LoadResources() (err error) {
	var ns coreV1.Namespace
	if err := r.Reader.Get(r.ctx, types.NamespacedName{Name: r.application.Name}, &ns); err != nil {

		if errors.IsNotFound(err) {
			return nil
		}

		r.Log.Error(err, "Get Namespace for delete error.")
		return err
	}
	r.namespace = &ns
	return nil
}

func (r *ApplicationReconciler) ReconcileNamespace() (err error) {
	if r.namespace == nil {
		ns := &coreV1.Namespace{
			ObjectMeta: metaV1.ObjectMeta{
				Name: r.application.Name,
			},
		}

		if err := ctrl.SetControllerReference(r.application, ns, r.Scheme); err != nil {
			r.Log.Error(err, "SetControllerReference error when creating namespace.")
			return err
		}

		if err := r.Create(r.ctx, ns); err != nil {
			r.Log.Error(err, "create namespace failed")
			return err
		}

		r.namespace = ns
		r.Log.Info("namespace created.")
	} else {
		if err := ctrl.SetControllerReference(r.application, r.namespace, r.Scheme); err != nil {
			r.Log.Error(err, "SetControllerReference error when updating namespace.")
			return err
		}

		if r.namespace.DeletionTimestamp != nil {
			r.namespace.DeletionTimestamp = nil
			if err := r.Update(r.ctx, r.namespace); err != nil {
				r.Log.Error(err, "Clear namespace deletion timestamp error.")
				return err
			}
		}

		if err := r.Update(r.ctx, r.namespace); err != nil {
			r.Log.Error(err, "Update namespace error.")
			return err
		}
	}

	return nil
}

func (r *ApplicationReconciler) ReconcileComponents() error {
	var componentList corev1alpha1.ComponentList

	if err := r.Reader.List(r.ctx, &componentList, client.InNamespace(r.namespace.Name)); err != nil {
		r.Log.Error(err, "get componentList error")
		return err
	}

	for _, item := range componentList.Items {
		copiedComponent := item.DeepCopy()
		if copiedComponent.Annotations == nil {
			copiedComponent.Annotations = make(map[string]string)
		}

		copiedComponent.Annotations["lastTouchedByApplication"] = time.Now().String()
		if err := r.Patch(r.ctx, copiedComponent, client.MergeFrom(&item)); err != nil {
			r.Log.Error(err, "patch component failed")
			return err
		}
	}

	return nil
}

func (r *ApplicationReconciler) ReconcileConfigMaps() error {
	var configMap coreV1.ConfigMap

	if err := r.Reader.Get(r.ctx, types.NamespacedName{Namespace: r.namespace.Name, Name: files.KAPP_CONFIG_MAP_NAME}, &configMap); err != nil {
		if errors.IsNotFound(err) {
			configMap = coreV1.ConfigMap{
				ObjectMeta: metaV1.ObjectMeta{
					Name:      files.KAPP_CONFIG_MAP_NAME,
					Namespace: r.namespace.Name,
				},
			}

			if err := ctrl.SetControllerReference(r.application, &configMap, r.Scheme); err != nil {
				r.Log.Error(err, "SetControllerReference error when creating configmap.")
				return err
			}

			if err := r.Create(r.ctx, &configMap); err != nil {
				r.Log.Error(err, "create kapp default config map error")
				return err
			}
		} else {
			r.Log.Error(err, "get kapp default config map error")
			return err
		}
	}

	if err := ctrl.SetControllerReference(r.application, &configMap, r.Scheme); err != nil {
		r.Log.Error(err, "SetControllerReference error when creating configmap.")
		return err
	}

	// TODO should we use patch here to avoid conflict
	if err := r.Update(r.ctx, &configMap); err != nil {
		r.Log.Error(err, "update configmap error")
		return err
	}

	return nil
}

func (r *ApplicationReconciler) SetupWithManager(mgr ctrl.Manager) error {
	if err := mgr.GetFieldIndexer().IndexField(&coreV1.Namespace{}, ownerKey, func(rawObj runtime.Object) []string {
		owner := metaV1.GetControllerOf(rawObj.(*coreV1.Namespace))

		if owner == nil {
			return nil
		}

		if owner.APIVersion != apiGVStr || owner.Kind != "Namespace" {
			return nil
		}

		return []string{owner.Name}
	}); err != nil {
		return err
	}

	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.Application{}).
		Owns(&coreV1.Namespace{}).
		Complete(r)
}
