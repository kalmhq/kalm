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

	"k8s.io/apimachinery/pkg/api/errors"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	corev1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/kalmhq/kalm/controller/utils"
)

const DNSRecordFinalizer = "dns-record-finalizer"

// DNSRecordReconciler reconciles a DNSRecord object
type DNSRecordReconciler struct {
	*BaseReconciler
	ctx    context.Context
	dnsMgr DNSManager
}

func NewDNSRecordReconciler(mgr ctrl.Manager) *DNSRecordReconciler {
	var dnsMgr DNSManager
	if cloudflareDNSMgr, err := initCloudflareDNSManagerFromEnv(); err != nil {
		ctrl.Log.Info("failed when initCloudflareDNSManagerFromEnv", "err", err)
	} else {
		dnsMgr = cloudflareDNSMgr
	}

	return &DNSRecordReconciler{
		BaseReconciler: NewBaseReconciler(mgr, "DNSRecord"),
		ctx:            context.Background(),
		dnsMgr:         dnsMgr,
	}
}

// if this annotation is marked with true, will not delete DNS record at cloudflare
const SkipRemoveRecordOnDeleteAnnotation = "skip-remove-record-on-delete"

// +kubebuilder:rbac:groups=core.kalm.dev,resources=dnsrecords,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kalm.dev,resources=dnsrecords/status,verbs=get;update;patch

func (r *DNSRecordReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	log := r.Log.WithValues("dnsrecord", req.NamespacedName)

	if r.dnsMgr == nil {
		log.Info("dnsMgr not initialized, reconcile skipped")
		return ctrl.Result{}, nil
	}

	record := v1alpha1.DNSRecord{}
	if err := r.Get(r.ctx, client.ObjectKey{Name: req.Name}, &record); err != nil {
		if errors.IsNotFound(err) {
			return ctrl.Result{}, nil
		}

		return ctrl.Result{}, err
	}

	copied := record.DeepCopy()

	if record.DeletionTimestamp != nil {
		skipRemoveRecord := false
		if record.Annotations[SkipRemoveRecordOnDeleteAnnotation] == "true" {
			skipRemoveRecord = true
		}

		if !skipRemoveRecord {
		  // ensure DNS Record is deleted before deletion of CDR
		  if exist, err := r.dnsMgr.Exist(record.Spec.DNSType, record.Spec.Domain, record.Spec.DNSTarget); err != nil {
		  	return ctrl.Result{}, err
		  } else if exist {
		  	if err := r.dnsMgr.DeleteDNSRecord(record.Spec.DNSType, record.Spec.Domain); err != nil {
		  		return ctrl.Result{}, err
		  	}
		  }
		}

		copied.Finalizers = utils.RemoveString(copied.Finalizers, DNSRecordFinalizer)

		return ctrl.Result{}, r.Update(r.ctx, copied)
	} else {
		if !utils.ContainsString(copied.Finalizers, DNSRecordFinalizer) {
			copied.Finalizers = append(copied.Finalizers, DNSRecordFinalizer)
			return ctrl.Result{}, r.Update(r.ctx, copied)
		}
	}

	err := r.dnsMgr.UpsertDNSRecord(record.Spec.DNSType, record.Spec.Domain, record.Spec.DNSTarget)
	if err != nil {
		if err == NoCloudflareZoneIDForDomainError {
			log.Error(err, "unknown domain for this dnsManager, ignored", "domain", record.Spec.Domain)

			return ctrl.Result{}, nil
		}

		log.Error(err, "fail to UpsertDNSRecord", "record", record.Spec)
		return ctrl.Result{}, err
	}

	recordExist, err := r.dnsMgr.Exist(record.Spec.DNSType, record.Spec.Domain, record.Spec.DNSTarget)
	if err != nil {
		return ctrl.Result{}, err
	}

	copied.Status.IsConfigured = recordExist

	return ctrl.Result{}, r.Status().Update(r.ctx, copied)
}

func (r *DNSRecordReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.DNSRecord{}).
		Complete(r)
}
