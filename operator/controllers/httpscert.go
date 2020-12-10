package controllers

import (
	"fmt"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"k8s.io/apimachinery/pkg/api/errors"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// example: us-west1-1.clusters.kalm-apps.com
func (r *KalmOperatorConfigReconciler) reconcileHttpsCertForDomain(baseAppDomain string, applyForWildcardCert bool) error {
	var certName string
	var certIssuer string
	var domains []string

	if applyForWildcardCert {
		certName = fmt.Sprintf("kalmoperator-dns01-%s", keepOnlyLetters(baseAppDomain, "-"))
		certIssuer = v1alpha1.DefaultDNS01IssuerName
		domains = []string{
			baseAppDomain,
			fmt.Sprintf("*.%s", baseAppDomain),
		}
	} else {
		certName = fmt.Sprintf("kalmoperator-http01-%s", keepOnlyLetters(baseAppDomain, "-"))
		certIssuer = v1alpha1.DefaultHTTP01IssuerName
		domains = []string{
			baseAppDomain,
		}
	}

	expectedHttpsCert := v1alpha1.HttpsCert{
		ObjectMeta: ctrl.ObjectMeta{
			Name: certName,
			Labels: map[string]string{
				v1alpha1.TenantNameLabelKey: v1alpha1.DefaultSystemTenantName,
			},
		},
		Spec: v1alpha1.HttpsCertSpec{
			HttpsCertIssuer: certIssuer,
			Domains:         domains,
		},
	}

	var httpsCert v1alpha1.HttpsCert
	var isNew bool

	if err := r.Get(r.Ctx, client.ObjectKey{Name: expectedHttpsCert.Name}, &httpsCert); err != nil {
		if errors.IsNotFound(err) {
			isNew = true
			httpsCert = expectedHttpsCert
		} else {
			return err
		}
	} else {
		httpsCert.Spec = expectedHttpsCert.Spec
	}

	if isNew {
		return r.Create(r.Ctx, &httpsCert)
	} else {
		return r.Update(r.Ctx, &httpsCert)
	}
}

func keepOnlyLetters(domain, replace string) string {
	var rst string
	for _, char := range domain {
		if ('A' <= char && char <= 'Z') ||
			('a' <= char && char <= 'z') {
			rst += fmt.Sprintf("%c", char)
		} else {
			rst += replace
		}
	}
	return rst

}
