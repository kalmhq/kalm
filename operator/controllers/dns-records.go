package controllers

import (
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	corev1 "k8s.io/api/core/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (r *KalmOperatorConfigReconciler) getOperatorReconciledDNS01HttpscertDomain(baseAppDomain string) string {
	httpscert := v1alpha1.HttpsCert{}
	certName := getCertName(baseAppDomain, true)
	objkey := client.ObjectKey{
		Name: certName,
	}

	if err := r.Get(r.Ctx, objkey, &httpscert); err != nil {
		return ""
	}

	acmeDomain, exist := httpscert.Status.WildcardCertDNSChallengeDomainMap[baseAppDomain]
	if !exist {
		r.Log.Info("no record in WildcardCertDNSChallengeDomainMap, ignored", "domain", baseAppDomain)
		return ""
	}

	return acmeDomain
}

func (r *KalmOperatorConfigReconciler) getClusterIPAndHostname() (string, string) {
	svc := corev1.Service{}
	svcObjKey := client.ObjectKey{
		Namespace: "istio-system",
		Name:      "istio-ingressgateway",
	}

	if err := r.Get(r.Ctx, svcObjKey, &svc); err != nil {
		return "", ""
	} else {
		ing := svc.Status.LoadBalancer.Ingress
		if len(ing) <= 0 {
			return "", ""
		}

		return ing[0].IP, ing[0].Hostname
	}
}

func (r *KalmOperatorConfigReconciler) getACMEServerIP() string {
	svc := corev1.Service{}
	svcObjKey := client.ObjectKey{
		Namespace: "kalm-system",
		Name:      "lb-svc-acme-server",
	}

	if err := r.Get(r.Ctx, svcObjKey, &svc); err != nil {
		return ""
	} else {
		ing := svc.Status.LoadBalancer.Ingress
		if len(ing) <= 0 {
			return ""
		}

		return ing[0].IP
	}
}
