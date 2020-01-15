package controllers

import (
	"context"
	"fmt"
	"github.com/go-logr/logr"
	corev1alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
	"github.com/kapp-staging/kapp/util"
	appv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"time"
)

// There will be a new Task instance for each reconciliation
type applicationReconcilerTask struct {
	ctx        context.Context
	reconciler *ApplicationReconciler
	app        *corev1alpha1.Application
	req        ctrl.Request
	log        logr.Logger

	deployments []appv1.Deployment
	services    []corev1.Service
}

func newApplicationReconcilerTask(
	reconciler *ApplicationReconciler,
	app *corev1alpha1.Application,
	req ctrl.Request,
) *applicationReconcilerTask {
	return &applicationReconcilerTask{
		context.Background(),
		reconciler,
		app,
		req,
		reconciler.Log,
		[]appv1.Deployment{},
		[]corev1.Service{},
	}
}

func (act *applicationReconcilerTask) Run() (err error) {
	log := act.log
	ctx := act.ctx
	app := act.app
	// handle delete
	if shouldFinishReconcilation, err := act.handleDelete(); err != nil || shouldFinishReconcilation {
		if err != nil {
			log.Error(err, "unable to delete Application")
		}
		return err
	}

	err = act.getDeployments()

	if err != nil {
		log.Error(err, "unable to list child deployments")
		return err
	}

	err = act.getServices()

	if err != nil {
		log.Error(err, "unable to list child services")
		return err
	}

	var deployment *appv1.Deployment

	if len(act.deployments) != 0 {
		deployment = &(act.deployments[0])
	}

	deployment, err = act.constructorDeploymentFromApplication(deployment)

	if err != nil {
		log.Error(err, "unable to construct deployment from app")
		return err
	}

	// TODO: realy check
	if len(act.deployments) > 0 {
		if err := act.reconciler.Update(ctx, deployment); err != nil {
			log.Error(err, "unable to update Deployment for Application", "app", app)
			return err
		}
		log.Info("update Deployment")
	} else {
		if err := act.reconciler.Create(ctx, deployment); err != nil {
			log.Error(err, "unable to create Deployment for Application", "app", app)
			return err
		}
		log.Info("create Deployment")
	}

	return nil
}

func (act *applicationReconcilerTask) getDeployments() error {
	var deploymentList appv1.DeploymentList

	if err := act.reconciler.List(
		act.ctx,
		&deploymentList,
		client.InNamespace(act.req.Namespace),
		client.MatchingFields{
			applicationOwnerKey: act.req.Name,
		},
	); err != nil {
		act.log.Error(err, "unable to list child deployments")
		return err
	}

	act.deployments = deploymentList.Items

	return nil
}

func (act *applicationReconcilerTask) getServices() error {
	var serviceList corev1.ServiceList

	if err := act.reconciler.List(
		act.ctx,
		&serviceList,
		client.InNamespace(act.req.Namespace),
		client.MatchingFields{
			applicationOwnerKey: act.req.Name,
		},
	); err != nil {
		act.log.Error(err, "unable to list child services")
		return err
	}

	act.services = serviceList.Items

	return nil
}

func (act *applicationReconcilerTask) handleDelete() (shouldFinishReconcilation bool, err error) {
	app := act.app
	ctx := act.ctx

	// examine DeletionTimestamp to determine if object is under deletion
	if app.ObjectMeta.DeletionTimestamp.IsZero() {
		// The object is not being deleted, so if it does not have our finalizer,
		// then lets add the finalizer and update the object. This is equivalent
		// registering our finalizer.
		if !util.ContainsString(app.ObjectMeta.Finalizers, finalizerName) {
			app.ObjectMeta.Finalizers = append(app.ObjectMeta.Finalizers, finalizerName)
			if err := act.reconciler.Update(context.Background(), app); err != nil {
				return true, err
			}
		}
	} else {
		// The object is being deleted
		if util.ContainsString(app.ObjectMeta.Finalizers, finalizerName) {
			// our finalizer is present, so lets handle any external dependency
			if err := act.deleteExternalResources(); err != nil {
				// if fail to delete the external dependency here, return with error
				// so that it can be retried
				return true, err
			}

			// remove our finalizer from the list and update it.
			app.ObjectMeta.Finalizers = util.RemoveString(app.ObjectMeta.Finalizers, finalizerName)
			if err := act.reconciler.Update(ctx, app); err != nil {
				return true, err
			}
		}

		return true, nil
	}

	return false, nil
}

func (act *applicationReconcilerTask) deleteExternalResources() error {
	log := act.log
	ctx := act.ctx

	if err := act.getDeployments(); err != nil {
		log.Error(err, "unable to list child deployments")
		return err
	}

	for _, deployment := range act.deployments {
		log.Info("delete deployment")
		if err := act.reconciler.Delete(ctx, &deployment); err != nil {
			log.Error(err, "delete deployment error")
			return err
		}
	}

	log.Info("Delete External Resources Done")

	return nil

}

func (act *applicationReconcilerTask) constructorDeploymentFromApplication(deployment *appv1.Deployment) (*appv1.Deployment, error) {
	app := act.app

	label := fmt.Sprintf("%s-%d", app.Name, time.Now().UTC().Unix())
	labelMap := map[string]string{"kapp-component": label}

	component := app.Spec.Components[0]

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
					Spec: corev1.PodSpec{
						Containers: []corev1.Container{
							{
								Name:    component.Name,
								Image:   component.Image,
								Env:     []corev1.EnvVar{},
								Command: component.Command,
								Args:    component.Args,
							},
						},
					},
				},
				Selector: &metav1.LabelSelector{
					MatchLabels: labelMap,
				},
			},
		}
	}

	// apply envs
	deployment.Spec.Template.Spec.Containers[0].Env = deployment.Spec.Template.Spec.Containers[0].Env[0:0]
	for _, env := range component.Env {
		deployment.Spec.Template.Spec.Containers[0].Env = append(
			deployment.Spec.Template.Spec.Containers[0].Env,
			corev1.EnvVar{
				Name:  env.Name,
				Value: env.Value,
			},
		)
	}

	// apply plugins
	for _, pluginDef := range app.Spec.Components[0].Plugins {
		plugin := corev1alpha1.GetPlugin(pluginDef)

		switch p := plugin.(type) {
		case *corev1alpha1.PluginManualScaler:
			p.Operate(deployment)
		}
	}

	if err := ctrl.SetControllerReference(app, deployment, act.reconciler.Scheme); err != nil {
		return nil, err
	}

	return deployment, nil
}
