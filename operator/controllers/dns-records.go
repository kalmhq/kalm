package controllers

import (
	"fmt"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/kalmhq/kalm/controller/controllers"
	installv1alpha1 "github.com/kalmhq/kalm/operator/api/v1alpha1"
	corev1 "k8s.io/api/core/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (r *KalmOperatorConfigReconciler) reconcileDNSRecords(config *installv1alpha1.KalmOperatorConfig) error {
	// currently only reconcile for SaaS mode
	if config.Spec.KalmType == "local" {
		r.Log.Info("kalmType is local, reconcileDNSRecords skipped")
		return nil
	}

	cloudflareConfig := config.Spec.CloudflareConfig
	if cloudflareConfig == nil {
		r.Log.Info("cloudflareConfig not exist, reconcileDNSRecords skipped")
		return nil
	}

	baseDNSDomain := config.Spec.BaseDNSDomain
	if baseDNSDomain == "" {
		r.Log.Info("baseDNSDomain is not set, reconcileDNSRecords skipped")
		return nil
	}

	dnsManager, err := controllers.NewCloudflareDNSManager(cloudflareConfig.APIToken, cloudflareConfig.DomainToZoneIDConfig)
	if err != nil {
		r.Log.Info("NewCloudflareDNSManager failed", "error", err)
		return err
	}

	// acme-server
	//
	// NS,   acme.tmp.clusters.kalm-dns.com → ns-acme.tmp.clusters.kalm-dns.com
	// A, ns-acme.tmp.clusters.kalm-dns.com → ipForNameServer
	acmeDomain := getBaseACMEDomain(baseDNSDomain)
	nsDomain := getBaseNSDomain(baseDNSDomain)

	err = dnsManager.UpsertDNSRecord(v1alpha1.DNSTypeNS, acmeDomain, nsDomain)
	if err != nil {
		r.Log.Info("UpsertDNSRecord failed, ignored", "error", err)
	}

	// find IP for NameServer
	nameServerSvc := corev1.Service{}
	nameServerObjKey := client.ObjectKey{
		Namespace: v1alpha1.KalmSystemNamespace,
		Name:      controllers.GetNameForLoadBalanceServiceForNSDomain(),
	}

	if err := r.Get(r.Ctx, nameServerObjKey, &nameServerSvc); err != nil {
		r.Log.Info("get nameServerSvc failed, ignored", "error", err)
	} else {
		ing := nameServerSvc.Status.LoadBalancer.Ingress
		if len(ing) > 0 && ing[0].IP != "" {
			ip := ing[0].IP

			err := dnsManager.UpsertDNSRecord(v1alpha1.DNSTypeA, nsDomain, ip)
			if err != nil {
				r.Log.Info("UpsertDNSRecord failed, ignored", "error", err)
			}
		}
	}

	clusterIP := r.getClusterIP()

	// apps
	//
	// CNAME, _acme-challenge.tmp.clusters.kalm-apps.com → xxx.acme.tmp.clusters.kalm-dns.com
	// A,                 (*.)tmp.clusters.kalm-apps.com → ClusterIP (2, with and without prefix: *.)
	baseAppDomain := config.Spec.BaseAppDomain
	if baseAppDomain != "" {
		// find if acme-server has generated domain record
		acmeDomain := r.getOperatorReconciledDNS01HttpscertDomain(baseAppDomain)
		if acmeDomain == "" {
			r.Log.Info("no acmeRecord found, ignored", "domain", baseAppDomain)
		} else {
			forACMEChallenge := fmt.Sprintf("_acme-challenge.%s", baseAppDomain)
			err := dnsManager.UpsertDNSRecord(v1alpha1.DNSTypeCNAME, forACMEChallenge, acmeDomain)
			if err != nil {
				r.Log.Info("UpsertDNSRecord failed, ignored", "error", err)
			}
		}

		if clusterIP != "" {
			if err := dnsManager.UpsertDNSRecord(v1alpha1.DNSTypeA, baseAppDomain, clusterIP); err != nil {
				r.Log.Info("UpsertDNSRecord failed, ignored", "error", err)
			}

			wildcardBaseAppDomain := fmt.Sprintf("*.%s", baseAppDomain)
			if err := dnsManager.UpsertDNSRecord(v1alpha1.DNSTypeA, wildcardBaseAppDomain, clusterIP); err != nil {
				r.Log.Info("UpsertDNSRecord failed, ignored", "error", err)
			}
		}
	}

	// dashboard
	//
	// CNAME 中转  _acme-challenge.BASE-DASHBOARD-DOMAIN → dashboard-acme-challenge.tmp.clusters.kalm-dns.com → xxx.acme.tmp.clusters.kalm-dns.com
	// A     中转              (*.)BASE-DASHBOARD-DOMAIN →             dashboard-ip.tmp.clusters.kalm-dns.com → ClusterIP
	//
	// benifit of using intermediate domains: dashboard's direct CNAME record is predictable
	baseDashboardDomain := config.Spec.BaseDashboardDomain
	if baseDashboardDomain != "" && baseDNSDomain != "" {
		// ACME challenge
		// todo add retry here
		acmeDomain := r.getOperatorReconciledDNS01HttpscertDomain(baseDashboardDomain)
		if acmeDomain == "" {
			r.Log.Info("no acmeRecord found, ignored", "domain", baseDashboardDomain)
		} else {
			intermediateACMEChallengeDomainForDash := fmt.Sprintf("dashboard-acme-challenge.%s", baseDNSDomain)
			err := dnsManager.UpsertDNSRecord(v1alpha1.DNSTypeCNAME, intermediateACMEChallengeDomainForDash, acmeDomain)
			if err != nil {
				r.Log.Info("UpsertDNSRecord failed, ignored", "error", err)
			} else {
				r.Log.Info("UpsertDNSRecord succeed", "record", fmt.Sprintf("%s -> %s", intermediateACMEChallengeDomainForDash, acmeDomain))
			}
		}

		// A records
		if clusterIP != "" {
			intermediateDomainForDashboardIP := fmt.Sprintf("dashboard-ip.%s", baseDNSDomain)
			if err := dnsManager.UpsertDNSRecord(v1alpha1.DNSTypeA, intermediateDomainForDashboardIP, clusterIP); err != nil {
				r.Log.Info("UpsertDNSRecord failed, ignored", "error", err)
			}
		}
	}

	return nil
}

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

func (r *KalmOperatorConfigReconciler) getClusterIP() string {
	svc := corev1.Service{}
	svcObjKey := client.ObjectKey{
		Namespace: "istio-system",
		Name:      "istio-ingressgateway",
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
