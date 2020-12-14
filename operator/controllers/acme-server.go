package controllers

import (
	"fmt"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"k8s.io/apimachinery/pkg/api/errors"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// example:
//
// baseDNSDomain:         us-west1-1.clusters.kalm-dns.com
//    acmeDomain:    acme.us-west1-1.clusters.kalm-dns.com
//      nsDomain: ns-acme.us-west1-1.clusters.kalm-dns.com
func (r *KalmOperatorConfigReconciler) reconcileACMEServer(baseDNSDomain string) error {
	if baseDNSDomain == "" {
		return nil
	}

	acmeDomain := getBaseACMEDomain(baseDNSDomain)
	nsDomain := getBaseNSDomain(baseDNSDomain)

	expectedACMEServer := v1alpha1.ACMEServer{
		ObjectMeta: ctrl.ObjectMeta{
			Name: v1alpha1.ACMEServerName,
		},
		Spec: v1alpha1.ACMEServerSpec{
			ACMEDomain: acmeDomain,
			NSDomain:   nsDomain,
		},
	}

	var isNew bool
	var acmeServer v1alpha1.ACMEServer

	if err := r.Get(r.Ctx, client.ObjectKey{Name: expectedACMEServer.Name}, &acmeServer); err != nil {
		if errors.IsNotFound(err) {
			isNew = true
			acmeServer = expectedACMEServer
		} else {
			return err
		}
	}

	if isNew {
		return r.Create(r.Ctx, &acmeServer)
	} else {
		acmeServer.Spec = expectedACMEServer.Spec
		return r.Update(r.Ctx, &acmeServer)
	}
}

func getBaseACMEDomain(baseDNSDomain string) string {
	if baseDNSDomain == "" {
		return ""
	}

	acmeDomain := fmt.Sprintf("acme.%s", baseDNSDomain)
	return acmeDomain
}

func getBaseNSDomain(baseDNSDomain string) string {
	if baseDNSDomain == "" {
		return ""
	}

	nsDomain := fmt.Sprintf("ns-acme.%s", baseDNSDomain)
	return nsDomain
}
