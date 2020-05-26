package controllers

import (
	"context"
	"fmt"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	corev1 "k8s.io/api/core/v1"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
	"time"
)

type KappNamespacesReconciler struct {
	*BaseReconciler
}

const (
	KappEnableLabelName  = "kapp-enabled"
	KappEnableLabelValue = "true"
)

func NewKappNamespacesReconciler(mgr ctrl.Manager) *KappNamespacesReconciler {
	return &KappNamespacesReconciler{
		NewBaseReconciler(mgr, "KappNamespaces"),
	}
}

func (r *KappNamespacesReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		Owns(&corev1.Namespace{}).
		Complete(r)
}

func (r *KappNamespacesReconciler) Reconcile(request reconcile.Request) (reconcile.Result, error) {
	fmt.Println("reconciling kappNS", request)

	task := KappNamespaceReconcilerTask{
		KappNamespacesReconciler: r,
		ctx:                      context.Background(),
	}

	return ctrl.Result{}, task.Run(request)
}

type KappNamespaceReconcilerTask struct {
	*KappNamespacesReconciler
	ctx context.Context
}

func (r KappNamespaceReconcilerTask) Run(req ctrl.Request) error {
	var namespaceList corev1.NamespaceList
	if err := r.Get(r.ctx, client.ObjectKey{}, &namespaceList); err != nil {
		err = client.IgnoreNotFound(err)
		return err
	}

	now := time.Now()

	for _, ns := range namespaceList.Items {
		_, exist := ns.Labels[KappEnableLabelName]
		if !exist {
			continue
		}

		var compList v1alpha1.ComponentList
		if err := r.Get(r.ctx, client.ObjectKey{Namespace: ns.Name}, &compList); client.IgnoreNotFound(err) != nil {
			return err
		}

		for _, item := range compList.Items {
			component := item.DeepCopy()
			if component.Labels == nil {
				component.Labels = map[string]string{}
			}

			component.Labels["kapp-namespace-updated-at"] = now.String()
			if err := r.Update(r.ctx, component); err != nil {
				return err
			}
		}
	}

	return nil
}

type IReconcilerTask interface {
	Run(req ctrl.Request) error
}
