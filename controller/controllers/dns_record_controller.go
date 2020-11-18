package controllers

import (
	"context"
	corev1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
	"k8s.io/apimachinery/pkg/api/errors"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
)

type DnsRecordReconciler struct {
	*BaseReconciler
	DnsRecorder
	ctx context.Context
}

func NewDnsRecordReconciler(mgr ctrl.Manager, dnsRecorder DnsRecorder) *DnsRecordReconciler {
	return &DnsRecordReconciler{
		BaseReconciler: NewBaseReconciler(mgr, "DnsRecord"),
		ctx:            context.Background(),
		DnsRecorder:    dnsRecorder,
	}
}

func (d DnsRecordReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	var dnsRecord corev1alpha1.DnsRecord
	if err := d.Get(d.ctx, req.NamespacedName, &dnsRecord); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	var tenant corev1alpha1.Tenant
	err := d.Get(d.ctx, client.ObjectKey{Name: dnsRecord.Spec.TenantName}, &tenant)
	if err != nil {
		if errors.IsNotFound(err) {
			if dnsRecord.Status.Status == "ready" {
				if err := d.DnsRecorder.DeleteDnsRecord(&dnsRecord); err != nil {

				} else {
					d.Client.Delete(d.ctx, &dnsRecord)
				}

			}
			return ctrl.Result{}, nil
		} else {
			return ctrl.Result{}, err
		}
	}

	switch dnsRecord.Status.Status {
	case "created":
		if err := d.DnsRecorder.CreateDnsRecord(&dnsRecord); err != nil {
			return ctrl.Result{}, err
		}
		dnsRecord.Status.Status = "pending"
	case "pending":
		if ready, err := d.DnsRecorder.CheckDnsRecordReady(&dnsRecord); err != nil {
			return ctrl.Result{}, err
		} else if ready == true {
			dnsRecord.Status.Status = "pending"
		}
	case "ready":
	default:

	}

	return ctrl.Result{}, nil
}

func (d *DnsRecordReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.DnsRecord{}).
		Owns(&corev1alpha1.Tenant{}).
		Watches(genSourceForObject(&corev1alpha1.Tenant{}), &handler.EnqueueRequestsFromMapFunc{
			ToRequests: ACMEDNSComponentMapper{}, //TODO
		}).
		Complete(d)
}
