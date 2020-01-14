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
	"github.com/kapp-staging/kapp/util"
	appv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"time"

	"github.com/go-logr/logr"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	corev1alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
)

// ApplicationReconciler reconciles a Application object
type ApplicationReconciler struct {
	client.Client
	Log    logr.Logger
	Scheme *runtime.Scheme
}

var applicationOwnerKey = ".metadata.controller"
var apiGVStr = corev1alpha1.GroupVersion.String()
var finalizerName = "storage.finalizers.kapp.dev"

// +kubebuilder:rbac:groups=core.kapp.dev,resources=applications,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=applications/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=extensions,resources=deployments,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=extensions,resources=deployments/status,verbs=get

func (r *ApplicationReconciler) constructorDeploymentFromApplication(app *corev1alpha1.Application, deployment *appv1.Deployment) (*appv1.Deployment, error) {
	label := fmt.Sprintf("%s-%d", app.Name, time.Now().UTC().Unix())
	labelMap := map[string]string{"kapp-component": label}

	if deployment == nil {
		deployment = &appv1.Deployment{
			ObjectMeta: metav1.ObjectMeta{
				Labels:      make(map[string]string),
				Annotations: make(map[string]string),
				Name:        fmt.Sprintf("%s-%s", app.Name, app.Spec.Components[0].Name),
				Namespace:   app.Namespace,
			},
			Spec: appv1.DeploymentSpec{
				Template: corev1.PodTemplateSpec{
					ObjectMeta: metav1.ObjectMeta{
						Labels: labelMap,
					},
					Spec: corev1.PodSpec{Containers: []corev1.Container{{Name: app.Spec.Components[0].Name, Image: app.Spec.Components[0].Image}}},
				},
				Selector: &metav1.LabelSelector{
					MatchLabels: labelMap,
				},
			},
		}
	}

	// apply plugins
	for _, pluginDef := range app.Spec.Components[0].Plugins {
		plugin := corev1alpha1.GetPlugin(pluginDef)

		switch p := plugin.(type) {
		case *corev1alpha1.PluginManualScaler:
			p.Operate(deployment)
		}
	}

	if err := ctrl.SetControllerReference(app, deployment, r.Scheme); err != nil {
		return nil, err
	}

	return deployment, nil
}

func (r *ApplicationReconciler) getDeploymentsOfApp(ctx context.Context, req ctrl.Request, app *corev1alpha1.Application) ([]appv1.Deployment, error) {
	var deploymentList appv1.DeploymentList

	if err := r.List(ctx, &deploymentList, client.InNamespace(req.Namespace), client.MatchingFields{applicationOwnerKey: req.Name}); err != nil {
		r.Log.Error(err, "unable to list child deployments")
		return nil, err
	}

	return deploymentList.Items, nil
}

func (r *ApplicationReconciler) deleteExternalResources(ctx context.Context, req ctrl.Request, app *corev1alpha1.Application) error {
	deployments, err := r.getDeploymentsOfApp(ctx, req, app)

	if err != nil {
		r.Log.Error(err, "unable to list child deployments")
		return err
	}

	for _, deployment := range deployments {
		r.Log.Info("delete deployment")
		if err := r.Delete(ctx, &deployment); err != nil {
			r.Log.Error(err, "delete deployment error")
			return err
		}
	}

	r.Log.Info("Delete External Resources Done")

	return nil
}

func (r *ApplicationReconciler) handlerDelete(ctx context.Context, app *corev1alpha1.Application, req ctrl.Request) (shouldFinishReconcile bool, err error) {
	// examine DeletionTimestamp to determine if object is under deletion
	if app.ObjectMeta.DeletionTimestamp.IsZero() {
		// The object is not being deleted, so if it does not have our finalizer,
		// then lets add the finalizer and update the object. This is equivalent
		// registering our finalizer.
		if !util.ContainsString(app.ObjectMeta.Finalizers, finalizerName) {
			app.ObjectMeta.Finalizers = append(app.ObjectMeta.Finalizers, finalizerName)
			if err := r.Update(context.Background(), app); err != nil {
				return true, err
			}
		}
	} else {
		// The object is being deleted
		if util.ContainsString(app.ObjectMeta.Finalizers, finalizerName) {
			// our finalizer is present, so lets handle any external dependency
			if err := r.deleteExternalResources(ctx, req, app); err != nil {
				// if fail to delete the external dependency here, return with error
				// so that it can be retried
				return true, err
			}

			// remove our finalizer from the list and update it.
			app.ObjectMeta.Finalizers = util.RemoveString(app.ObjectMeta.Finalizers, finalizerName)
			if err := r.Update(ctx, app); err != nil {
				return true, err
			}
		}

		return true, nil
	}

	return false, nil
}

func (r *ApplicationReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()
	log := r.Log.WithValues("application", req.NamespacedName)

	var app corev1alpha1.Application

	if err := r.Get(ctx, req.NamespacedName, &app); err != nil {
		// we'll ignore not-found errors, since they can't be fixed by an immediate
		// requeue (we'll need to wait for a new notification), and we can get them
		// on deleted requests.
		err = client.IgnoreNotFound(err)

		if err != nil {
			log.Error(err, "unable to fetch Application")
		}

		return ctrl.Result{}, err
	}

	// handle delete
	if shouldFinishReconcile, err := r.handlerDelete(ctx, &app, req); err != nil || shouldFinishReconcile {
		if err != nil {
			log.Error(err, "unable to delete Application")
		}
		return ctrl.Result{}, err
	}

	deployments, err := r.getDeploymentsOfApp(ctx, req, &app)

	if err != nil {
		log.Error(err, "unable to list child deployments")
		return ctrl.Result{}, err
	}

	var deployment *appv1.Deployment

	if len(deployments) != 0 {
		deployment = &deployments[0]
	}

	deployment, err = r.constructorDeploymentFromApplication(&app, deployment)

	if err != nil {
		log.Error(err, "unable to construct deployment from app")
		return ctrl.Result{}, err
	}

	// TODO: realy check
	if len(deployments) > 0 {
		if err := r.Update(ctx, deployment); err != nil {
			log.Error(err, "unable to update Deployment for Application", "app", app)
			return ctrl.Result{}, err
		}
		log.Info("update Deployment")
	} else {
		if err := r.Create(ctx, deployment); err != nil {
			log.Error(err, "unable to create Deployment for Application", "app", app)
			return ctrl.Result{}, err
		}
		log.Info("create Deployment")
	}

	return ctrl.Result{}, nil
}

func (r *ApplicationReconciler) SetupWithManager(mgr ctrl.Manager) error {
	if err := mgr.GetFieldIndexer().IndexField(&appv1.Deployment{}, applicationOwnerKey, func(rawObj runtime.Object) []string {
		// grab the job object, extract the owner...
		deployment := rawObj.(*appv1.Deployment)
		owner := metav1.GetControllerOf(deployment)

		if owner == nil {
			return nil
		}

		if owner.APIVersion != apiGVStr || owner.Kind != "Application" {
			return nil
		}

		return []string{owner.Name}
	}); err != nil {
		return err
	}

	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.Application{}).
		Owns(&appv1.Deployment{}).
		Complete(r)
}
