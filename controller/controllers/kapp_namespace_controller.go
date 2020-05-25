package controllers

import (
	"context"
	corev1 "k8s.io/api/core/v1"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
)

type KappNamespacesReconciler struct {
	*BaseReconciler
}

func NewKappNamespacesReconciler(mgr ctrl.Manager) *KappNamespacesReconciler {
	return &KappNamespacesReconciler{
		BaseReconciler: NewBaseReconciler(mgr, "KappNamespaces"),
	}
}

func (r *KappNamespacesReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		Owns(&corev1.Namespace{}).
		Complete(r)
}

func (r *KappNamespacesReconciler) Reconcile(request reconcile.Request) (reconcile.Result, error) {
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

	for _, ns := range namespaceList.Items {
		v, exist := ns.Labels["kapp-enabled"]
		if !exist {
			continue
		}

		if v != "true" {
			//todo clean gw for this namespace
		} else {
			// todo make sure gw is ok
		}
	}

	return nil
}

type IReconcilerTask interface {
	Run(req ctrl.Request) error
}
