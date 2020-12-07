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
	"strings"

	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	corev1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
)

// DomainReconciler reconciles a Domain object
type DomainReconciler struct {
	*BaseReconciler
	ctx    context.Context
	dnsMgr DNSManager
}

func NewDomainReconciler(mgr ctrl.Manager) *DomainReconciler {
	token := corev1alpha1.GetEnvCloudflareToken()

	// domain1:zone1;domain2:zone2
	domain2ZoneConfig := corev1alpha1.GetEnvCloudflareDomainToZoneIDConfig()
	domain2ZoneMap := make(map[string]string)
	for _, pair := range strings.Split(domain2ZoneConfig, ";") {
		parts := strings.Split(pair, ":")

		if len(parts) != 2 {
			continue
		}
		domain2ZoneMap[parts[0]] = parts[1]
	}

	var dnsMgr DNSManager
	if cloudflareDNSMgr, err := NewCloudflareDNSManager(token, domain2ZoneMap); err != nil {
		ctrl.Log.Info("failed when NewCloudflareDNSManager", "err", err)
	} else {
		dnsMgr = cloudflareDNSMgr
	}

	return &DomainReconciler{
		BaseReconciler: NewBaseReconciler(mgr, "Domain"),
		ctx:            context.Background(),
		dnsMgr:         dnsMgr,
	}
}

// +kubebuilder:rbac:groups=core.kalm.dev,resources=domains,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kalm.dev,resources=domains/status,verbs=get;update;patch

// - kalmDomain
// - userDomain
//   - rootDomain -> A Record
//   - subDomain  -> CNAME
//     - wildcardDomain
//     - directDomain
func (r *DomainReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	log := r.Log.WithValues("domain", req.NamespacedName)

	domain := v1alpha1.Domain{}
	if err := r.Get(r.ctx, client.ObjectKey{Name: req.Name}, &domain); err != nil {
		if errors.IsNotFound(err) {
			return ctrl.Result{}, nil
		}

		return ctrl.Result{}, err
	}

	// do nothing if is kalm builtin domain
	if domain.Spec.IsKalmBuiltinDomain {
		return ctrl.Result{}, nil
	}

	// if is userSubDomain, setup IP for CNAME
	//   userSubDomain -> CNAME -> IP
	// rootDomain is A Record Already
	if !v1alpha1.IsRootDomain(domain.Spec.Domain) {
		if err := r.reconcileIPForUserSubDomainCNAME(domain.Spec.DNSTarget); err != nil {
			log.Info("reconcileIPForUserSubDomainCNAME fail", "err", err)
			return ctrl.Result{}, err
		}
	}

	isConfiguredAsExpected := domain.Status.IsDNSTargetConfigured
	isValidNoneWildcardDomain := v1alpha1.IsValidNoneWildcardDomain(domain.Spec.Domain)
	if isConfiguredAsExpected && isValidNoneWildcardDomain {
		err := r.reconcileHttpsCert(domain)
		if err != nil {
			return ctrl.Result{}, err
		}
	}

	return ctrl.Result{}, nil
}

func (r *DomainReconciler) reconcileHttpsCert(domain corev1alpha1.Domain) error {
	// ensure https cert is ready for the domain
	httpsCert := v1alpha1.HttpsCert{}
	isNew := false

	// cert share same name as domain
	certName := domain.Name
	if err := r.Get(r.ctx, client.ObjectKey{Name: certName}, &httpsCert); err != nil {
		if errors.IsNotFound(err) {
			isNew = true
		} else {
			return err
		}
	}

	expectedHttpsCert := v1alpha1.HttpsCert{
		ObjectMeta: metav1.ObjectMeta{
			Name: certName,
			Labels: map[string]string{
				v1alpha1.TenantNameLabelKey: domain.Labels[v1alpha1.TenantNameLabelKey],
			},
		},
		Spec: v1alpha1.HttpsCertSpec{
			IsSelfManaged:   false,
			HttpsCertIssuer: v1alpha1.DefaultHTTP01IssuerName,
			Domains:         []string{domain.Spec.Domain},
		},
	}

	if isNew {
		httpsCert = expectedHttpsCert

		if err := ctrl.SetControllerReference(&domain, &httpsCert, r.Scheme); err != nil {
			r.EmitWarningEvent(&domain, err, "unable to set domain as owner for HttpsCert when create")
			return err
		}

		if err := r.Create(r.ctx, &httpsCert); err != nil {
			r.EmitWarningEvent(&domain, err, "fail to create HttpCert for domain")
			return err
		}
	} else {
		httpsCert.Spec = expectedHttpsCert.Spec
		if err := r.Update(r.ctx, &httpsCert); err != nil {
			return err
		}
	}

	return nil
}

// setup part in parenthese:
//   userSubDomain -> (kalmCNAME -> A)
func (r *DomainReconciler) reconcileIPForUserSubDomainCNAME(cname string) error {
	if r.dnsMgr == nil {
		r.Log.Info("dnsMgr is not initied, reconcileIPForUserSubDomainCNAME ignored")
		return nil
	}

	// skip if already exist
	baseDNSDomain := corev1alpha1.GetEnvKalmBaseDNSDomain()
	records, err := r.dnsMgr.GetDNSRecords(baseDNSDomain)
	if err != nil {
		return err
	}

	targetIP, err := corev1alpha1.GetClusterIP()
	if err != nil {
		return err
	}
	if targetIP == "" {
		r.Log.Info("ClusterIP empty, reconcileIPForUserSubDomainCNAME ignored")
		return nil
	}

	for _, record := range records {
		if record.DNSType != corev1alpha1.DNSTypeA {
			continue
		}

		if record.Name == cname {
			if record.Content == targetIP {
				return nil
			}

			return r.dnsMgr.UpdateDNSRecord(corev1alpha1.DNSTypeA, cname, targetIP)
		}
	}

	// otherwise create
	return r.dnsMgr.CreateDNSRecord(corev1alpha1.DNSTypeA, cname, targetIP)
}

func (r *DomainReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.Domain{}).
		Complete(r)
}
