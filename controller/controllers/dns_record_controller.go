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
	corev1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/kalmhq/kalm/controller/utils"
	corev1 "k8s.io/api/core/v1"
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

// +kubebuilder:rbac:groups=core.kalm.dev,resources=dnsrecords,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kalm.dev,resources=dnsrecords/status,verbs=get;update;patch

func (d DnsRecordReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	var dnsRecord corev1alpha1.DnsRecord
	if err := d.Get(d.ctx, req.NamespacedName, &dnsRecord); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	finalizerName := "dns-record-finalizer"

	if dnsRecord.ObjectMeta.DeletionTimestamp.IsZero() {
		if !utils.ContainsString(dnsRecord.ObjectMeta.Finalizers, finalizerName) {
			dnsRecord.ObjectMeta.Finalizers = append(dnsRecord.ObjectMeta.Finalizers, finalizerName)
			if err := d.Update(context.Background(), &dnsRecord); err != nil {
				return ctrl.Result{}, err
			}
		}
	} else {
		if utils.ContainsString(dnsRecord.ObjectMeta.Finalizers, finalizerName) {
			if err := d.deleteExternalResources(dnsRecord); err != nil {
				return ctrl.Result{}, err
			}

			dnsRecord.ObjectMeta.Finalizers = utils.RemoveString(dnsRecord.ObjectMeta.Finalizers, finalizerName)
			if err := d.Update(context.Background(), &dnsRecord); err != nil {
				return ctrl.Result{}, err
			}
		}

		return ctrl.Result{}, nil
	}

	switch dnsRecord.Status.Status {
	case "", "created":
		if err := d.DnsRecorder.CreateDnsRecord(&dnsRecord); err != nil {
			return ctrl.Result{}, err
		}
		dnsRecord.Status.Status = "ready"
		d.Status().Update(d.ctx, &dnsRecord)
	//case "pending":
	//	if ready, err := d.DnsRecorder.CheckDnsRecordReady(&dnsRecord); err != nil {
	//		return ctrl.Result{}, err
	//	} else if ready == true {
	//		dnsRecord.Status.Status = "ready"
	//	}

	case "ready":
	default:

	}

	return ctrl.Result{}, nil
}

func (d *DnsRecordReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.DnsRecord{}).
		Watches(genSourceForObject(&corev1alpha1.HttpsCert{}), &handler.EnqueueRequestsFromMapFunc{
			ToRequests: &HttpsCertMapper{},
		}).
		Watches(genSourceForObject(&corev1alpha1.HttpsCertIssuer{}), &handler.EnqueueRequestsFromMapFunc{
			ToRequests: &HttpsCertIssuerMapper{},
		}).
		Watches(genSourceForObject(&corev1alpha1.Component{}), &handler.EnqueueRequestsFromMapFunc{
			ToRequests: &ACMEDNSComponentMapper{},
		}).
		Watches(genSourceForObject(&corev1.Service{}), &handler.EnqueueRequestsFromMapFunc{
			ToRequests: &ACMEDNSServiceMapper{},
		}).
		Complete(d)
}

func (d DnsRecordReconciler) deleteExternalResources(dnsRecord corev1alpha1.DnsRecord) error {
	if dnsRecord.Status.Status == "ready" || dnsRecord.Status.Status == "pending" {
		return d.DnsRecorder.DeleteDnsRecord(&dnsRecord)
	}

	return nil
}
