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
	"github.com/davecgh/go-spew/spew"
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

// +kubebuilder:rbac:groups=core.kapp.dev,resources=applications,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=applications/status,verbs=get;update;patch

func (r *ApplicationReconciler) constructorDeploymentFromApplication(app *corev1alpha1.Application) (*appv1.Deployment, error) {
	label := fmt.Sprintf("%s-%d", app.Name, time.Now().UTC().Unix())
	labelMap := map[string]string{"kapp-component": label}

	deployment := &appv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Labels:      make(map[string]string),
			Annotations: make(map[string]string),
			Name:        app.Name,
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

	if err := ctrl.SetControllerReference(app, deployment, r.Scheme); err != nil {
		return nil, err
	}

	return deployment, nil
}

func (r *ApplicationReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()
	log := r.Log.WithValues("application", req.NamespacedName)

	var app corev1alpha1.Application

	if err := r.Get(ctx, req.NamespacedName, &app); err != nil {
		log.Error(err, "unable to fetch Application")
		// we'll ignore not-found errors, since they can't be fixed by an immediate
		// requeue (we'll need to wait for a new notification), and we can get them
		// on deleted requests.
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	var deploymentList appv1.DeploymentList

	if err := r.List(ctx, &deploymentList, client.InNamespace(req.Namespace), client.MatchingFields{applicationOwnerKey: req.Name}); err != nil {
		log.Error(err, "unable to list child deployments")
		return ctrl.Result{}, err
	}

	spew.Dump(req, app, deploymentList)

	for _, deployment := range deploymentList.Items {

		if deployment.Name == app.Name {
			log.Info("Is working")
			return ctrl.Result{}, nil
		}
		spew.Dump(deployment.Name, app.Name)
	}

	deployment, err := r.constructorDeploymentFromApplication(&app)

	if err != nil {
		log.Error(err, "unable to construct deployment from app")
		return ctrl.Result{}, err
	}

	if err := r.Create(ctx, deployment); err != nil {
		log.Error(err, "unable to create Deployment for Application", "app", app)
		return ctrl.Result{}, err
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
		Complete(r)
}
