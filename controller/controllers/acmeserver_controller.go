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
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"sort"
	"strings"

	apps1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	v1 "k8s.io/api/storage/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/intstr"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	corev1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
)

// ACMEServerReconciler reconciles a ACMEServer object
type ACMEServerReconciler struct {
	*BaseReconciler
	ctx context.Context
}

// +kubebuilder:rbac:groups=core.kalm.dev,resources=acmeservers,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kalm.dev,resources=acmeservers/status,verbs=get;update;patch

func (r *ACMEServerReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	_ = r.Log.WithValues("acmeserver", req.NamespacedName)

	acmeServerList := corev1alpha1.ACMEServerList{}
	if err := r.List(r.ctx, &acmeServerList); err != nil {
		return ctrl.Result{}, err
	}

	size := len(acmeServerList.Items)
	if size <= 0 {
		return ctrl.Result{}, nil
	} else if size > 1 {
		return ctrl.Result{}, fmt.Errorf("at most 1 config for acmeServer, see: %d", size)
	}

	acmeServer := acmeServerList.Items[0]

	// reconcile LoadBalancer Service for NSDomain
	if err := r.reconcileLoadBalanceServiceForNSDomain(acmeServer); err != nil {
		r.Log.Error(err, "")
		return ctrl.Result{}, err
	}

	// reconcile LoadBalancer Service for NSDomain
	if err := r.reconcileACMEComponent(acmeServer); err != nil {

		if err == ErrLBSvcForACMEServerNotReady {
			r.Log.Info("lbService for ACMEServer not ready yet, reconciling skipped",
				"err",
				err)

			return ctrl.Result{}, nil
		}

		r.Log.Error(err, "fail reconcileACMEComponent()")
		return ctrl.Result{}, err
	}

	if err := r.reconcileIssuer(acmeServer); err != nil {
		r.Log.Error(err, "")
		return ctrl.Result{}, err
	}

	if err := r.reconcileStatus(acmeServer); err != nil {
		r.Log.Error(err, "")
		return ctrl.Result{}, err
	}

	return ctrl.Result{}, nil
}

func pickStorageClass(list v1.StorageClassList) v1.StorageClass {
	scList := list.Items
	sort.Slice(scList, func(i, j int) bool {
		a := scList[i]
		b := scList[j]

		managedA := a.Labels["kalm-managed"]
		managedB := b.Labels["kalm-managed"]

		if managedA == "true" && managedB == "true" {
			return strings.Compare(a.Name, b.Name) < 0
		} else if managedA == "true" {
			return true
		} else {
			return false
		}
	})

	return scList[0]
}

func genContentForACMEServerConfig(acmeDomain, nsDomain, nsDomainIP string) string {
	template := `
[general]
# DNS interface. Note that systemd-resolved may reserve port 53 on 127.0.0.53
# In this case acme-dns will error out and you will need to define the listening interface
# for example: listen = "127.0.0.1:53"
listen = "0.0.0.0:53"
# protocol, "both", "both4", "both6", "udp", "udp4", "udp6" or "tcp", "tcp4", "tcp6"
protocol = "both"
# domain name to serve the requests off of
domain = "ACME_DOMAIN_PLACEHOLDER"
# zone name server
nsname = "ACME_DOMAIN_PLACEHOLDER"
# admin email address, where @ is substituted with .
#nsadmin = "admin.example.org"
# predefined records served in addition to the TXT
records = [
    # domain pointing to the public IP of your acme-dns server
	#"ACME_DOMAIN_PLACEHOLDER. A  NS_DOMAIN_IP_PLACEHOLDER",
    # specify that ns-acme.example.xyz will resolve any *.acme.example.xyz records
    "ACME_DOMAIN_PLACEHOLDER. NS NS_DOMAIN_PLACEHOLDER.",
]
# debug messages from CORS etc
debug = true

[database]
# Database engine to use, sqlite3 or postgres
engine = "sqlite3"
# Connection string, filename for sqlite3 and postgres://$username:$password@$host/$db_name for postgres
# Please note that the default Docker image uses path /var/lib/acme-dns/acme-dns.db for sqlite3
connection = "/var/lib/acme-dns/acme-dns.db"
# connection = "postgres://user:password@localhost/acmedns_db"

[api]
# listen ip eg. 127.0.0.1
ip = "0.0.0.0"
# disable registration endpoint
disable_registration = false
# listen port, eg. 443 for default HTTPS
#port = "443"
port = "80"
# possible values: "letsencrypt", "letsencryptstaging", "cert", "none"
tls = "none"
# only used if tls = "cert"
# tls_cert_privkey = "/etc/tls/example.org/privkey.pem"
# tls_cert_fullchain = "/etc/tls/example.org/fullchain.pem"
# only used if tls = "letsencrypt"
# acme_cache_dir = "api-certs"
# CORS AllowOrigins, wildcards can be used
corsorigins = [
    "*"
]
# use HTTP header to get the client ip
use_header = false
# header name to pull the ip address / list of ip addresses from
header_name = "X-Forwarded-For"

[logconfig]
# logging level: "error", "warning", "info" or "debug"
loglevel = "debug"
# possible values: stdout, TODO file & integrations
logtype = "stdout"
# file path for logfile TODO
# logfile = "./acme-dns.log"
# format, either "json" or "text"
logformat = "text"`

	rst := strings.ReplaceAll(template, "ACME_DOMAIN_PLACEHOLDER", acmeDomain)
	rst = strings.ReplaceAll(rst, "NS_DOMAIN_PLACEHOLDER", nsDomain)
	rst = strings.ReplaceAll(rst, "NS_DOMAIN_IP_PLACEHOLDER", nsDomainIP)

	return rst
}

func (r *ACMEServerReconciler) getCertsUsingDNSIssuer(
	ctx context.Context) (rst []corev1alpha1.HttpsCert, err error) {

	var httpsCertList corev1alpha1.HttpsCertList
	err = r.List(ctx, &httpsCertList)
	if err != nil {
		return nil, err
	}

	for _, cert := range httpsCertList.Items {
		if cert.Spec.HttpsCertIssuer != corev1alpha1.DefaultDNS01IssuerName {
			continue
		}

		rst = append(rst, cert)
	}

	return rst, nil
}

func getSVCNameForACMEDNS() string {
	var host string
	if os.Getenv("ACME_DNS_HOST") != "" {
		host = os.Getenv("ACME_DNS_HOST")
	} else {
		host = fmt.Sprintf("%s.%s.svc.cluster.local", v1alpha1.ACMEServerName, KalmSystemNamespace)
	}

	return host
}

func (r *ACMEServerReconciler) registerACMEDNS(domains []string) (
	configs map[string]corev1alpha1.DNS01IssuerConfig,
	err error,
) {
	configs = make(map[string]corev1alpha1.DNS01IssuerConfig)

	url := fmt.Sprintf("http://%s/register", getSVCNameForACMEDNS())

	for _, domain := range domains {
		resp, err := http.Post(url, "", nil)
		if err != nil {
			r.Log.Error(err, fmt.Sprintf("POST %s fail", url))
			return nil, err
		}

		bytes, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}

		config := corev1alpha1.DNS01IssuerConfig{}
		if err := json.Unmarshal(bytes, &config); err != nil {
			r.Log.Error(err, fmt.Sprintf("err unmarshal resp: %s from %s", string(bytes), url))
			return nil, err
		}

		configs[domain] = config
	}

	return
}

type HttpsCertMapper struct {
}

func (h HttpsCertMapper) Map(object handler.MapObject) []reconcile.Request {
	cert, yes := object.Object.(*corev1alpha1.HttpsCert)
	if !yes {
		return nil
	}

	if cert.Spec.HttpsCertIssuer != corev1alpha1.DefaultDNS01IssuerName {
		return nil
	}

	return []reconcile.Request{
		{NamespacedName: types.NamespacedName{
			Name: fmt.Sprintf("trigger-by-https-cert-%s", object.Meta.GetName()),
		}},
	}
}

type HttpsCertIssuerMapper struct {
}

func (h HttpsCertIssuerMapper) Map(object handler.MapObject) []reconcile.Request {
	cert, yes := object.Object.(*corev1alpha1.HttpsCertIssuer)
	if !yes {
		return nil
	}

	if cert.Spec.DNS01 == nil {
		return nil
	}

	return []reconcile.Request{
		{NamespacedName: types.NamespacedName{
			Name: fmt.Sprintf("trigger-by-https-cert-issuer-%s", object.Meta.GetName()),
		}},
	}
}

func NewACMEServerReconciler(mgr ctrl.Manager) *ACMEServerReconciler {
	return &ACMEServerReconciler{
		BaseReconciler: NewBaseReconciler(mgr, "ACMEServer"),
		ctx:            context.Background(),
	}
}

type ACMEDNSComponentMapper struct {
}

func (A ACMEDNSComponentMapper) Map(object handler.MapObject) []reconcile.Request {
	if object.Meta.GetName() != v1alpha1.ACMEServerName {
		return nil
	}

	return []reconcile.Request{
		{NamespacedName: types.NamespacedName{
			Name: fmt.Sprintf("trigger-by-component-change-%s", object.Meta.GetName()),
		}},
	}
}

type ACMEDNSServiceMapper struct {
}

func (A ACMEDNSServiceMapper) Map(object handler.MapObject) []reconcile.Request {
	if object.Meta.GetNamespace() != KalmSystemNamespace ||
		object.Meta.GetName() != GetNameForLoadBalanceServiceForNSDomain() {
		return nil
	}

	svc := object.Object.(*corev1.Service)
	if len(svc.Status.LoadBalancer.Ingress) <= 0 ||
		svc.Status.LoadBalancer.Ingress[0].IP == "" {
		return nil
	}

	return []reconcile.Request{
		{NamespacedName: types.NamespacedName{
			Name: fmt.Sprintf("trigger-by-lb-svc-change-%s", object.Meta.GetName()),
		}},
	}
}

func (r *ACMEServerReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.ACMEServer{}).
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
		Complete(r)
}

func (r *ACMEServerReconciler) registerDomainsInACMEServer(
	httpsCertIssuer corev1alpha1.HttpsCertIssuer,
) (
	newlyRegisteredDomainConfigs map[string]corev1alpha1.DNS01IssuerConfig,
	needCleanDomains []string,
	err error,
) {

	dns01Certs, err := r.getCertsUsingDNSIssuer(r.ctx)
	if err != nil {
		return nil, nil, err
	}

	var needRegisterDomains []string
	domainsInCertsUsingDNSIssuer := make(map[string]interface{})

	for _, dns01Cert := range dns01Certs {
		// for both *.example.com & example.com
		// only 1 domain: example.com need to be registered
		domains := trimPrefixOfWildcardDomains(dns01Cert.Spec.Domains)

		for _, domain := range domains {
			domainsInCertsUsingDNSIssuer[domain] = true

			if _, exist := httpsCertIssuer.Spec.DNS01.Configs[domain]; exist {
				continue
			}

			needRegisterDomains = append(needRegisterDomains, domain)
		}
	}

	r.Log.Info("updateConfigsForIssuer", "needRegisterDomains", needRegisterDomains)

	newlyRegisteredDomainConfigs, err = r.registerACMEDNS(needRegisterDomains)
	if err != nil {
		r.Log.Error(err, "fail to registerACMEDNS")
		return nil, nil, err
	}

	if httpsCertIssuer.Spec.DNS01.Configs == nil {
		httpsCertIssuer.Spec.DNS01.Configs = make(map[string]corev1alpha1.DNS01IssuerConfig)
	}

	for domainInIssuerSpec := range httpsCertIssuer.Spec.DNS01.Configs {
		_, isDomainInIssuerSpecStillBeingUsedByCert := domainsInCertsUsingDNSIssuer[domainInIssuerSpec]
		if isDomainInIssuerSpecStillBeingUsedByCert {
			continue
		}

		needCleanDomains = append(needCleanDomains, domainInIssuerSpec)
	}

	return newlyRegisteredDomainConfigs, needCleanDomains, nil
}

// turn: *.example.com -> example.com
func trimPrefixOfWildcardDomains(domains []string) []string {
	m := make(map[string]interface{})
	for _, domain := range domains {
		if strings.HasPrefix(domain, "*.") {
			domain = domain[2:]
		}

		m[domain] = true
	}

	var rst []string
	for domain := range m {
		rst = append(rst, domain)
	}

	return rst
}

func GetNameForLoadBalanceServiceForNSDomain() string {
	return "lb-svc-" + v1alpha1.ACMEServerName
}

func (r *ACMEServerReconciler) reconcileLoadBalanceServiceForNSDomain(acmeServer corev1alpha1.ACMEServer) error {
	expectedLBService := corev1.Service{
		ObjectMeta: ctrl.ObjectMeta{
			Namespace: KalmSystemNamespace,
			Name:      GetNameForLoadBalanceServiceForNSDomain(),
			//todo tmp fix for aws
			Annotations: map[string]string{
				"service.beta.kubernetes.io/aws-load-balancer-type": "nlb",
			},
		},
		Spec: corev1.ServiceSpec{
			Type: corev1.ServiceTypeLoadBalancer,
			Ports: []corev1.ServicePort{
				{
					Name:       "dns",
					Port:       53,
					TargetPort: intstr.FromInt(53),
					Protocol:   corev1.ProtocolUDP,
				},
			},
			Selector: map[string]string{
				"app": v1alpha1.ACMEServerName,
			},
		},
	}

	svc := corev1.Service{}
	isNew := false

	err := r.Get(r.ctx, client.ObjectKey{
		Namespace: expectedLBService.Namespace,
		Name:      expectedLBService.Name,
	}, &svc)

	if err != nil {
		if errors.IsNotFound(err) {
			isNew = true
		} else {
			return err
		}
	}

	if isNew {
		if err := ctrl.SetControllerReference(&acmeServer, &svc, r.Scheme); err != nil {
			return err
		}

		svc = expectedLBService
		err = r.Create(r.ctx, &svc)
	} else {
		copied := svc.DeepCopy()

		copied.Spec.Selector = expectedLBService.Spec.Selector
		copied.Spec.Type = expectedLBService.Spec.Type

		if copied.Annotations == nil {
			copied.Annotations = make(map[string]string)
		}
		for k, v := range expectedLBService.Annotations {
			copied.Annotations[k] = v
		}

		//nodePort is auto set
		//copied.Spec.Ports = expectedLBService.Spec.Ports

		err = r.Patch(r.ctx, copied, client.MergeFrom(&svc))
	}

	return err
}

func (r *ACMEServerReconciler) reconcileIssuer(acmeServer corev1alpha1.ACMEServer) error {
	// reconcile companion issuer
	issuer := corev1alpha1.HttpsCertIssuer{}
	isNew := false

	err := r.Get(r.ctx, client.ObjectKey{Name: corev1alpha1.DefaultDNS01IssuerName}, &issuer)
	if err != nil {
		if errors.IsNotFound(err) {
			isNew = true

			issuer = corev1alpha1.HttpsCertIssuer{
				ObjectMeta: ctrl.ObjectMeta{
					Name: corev1alpha1.DefaultDNS01IssuerName,
				},
				Spec: corev1alpha1.HttpsCertIssuerSpec{
					DNS01: &corev1alpha1.DNS01Issuer{},
				},
			}
		} else {
			r.Log.Error(err, "")
			return err
		}
	}

	newlyRegisteredDomainConfigs, needCleanDomains, err := r.registerDomainsInACMEServer(issuer)
	if err != nil {
		r.Log.Error(err, "registerDomainsInACMEServer fail")
		return err
	}

	if isNew {
		if err := ctrl.SetControllerReference(&acmeServer, &issuer, r.Scheme); err != nil {
			r.Log.Error(err, "")
			return err
		}

		issuer.Spec.DNS01.Configs = newlyRegisteredDomainConfigs
		issuer.Spec.DNS01.BaseACMEDomain = acmeServer.Spec.ACMEDomain

		err = r.Create(r.ctx, &issuer)
	} else {
		copiedIssuer := issuer.DeepCopy()
		for domain, config := range newlyRegisteredDomainConfigs {
			issuer.Spec.DNS01.Configs[domain] = config
		}

		for _, needClean := range needCleanDomains {
			delete(issuer.Spec.DNS01.Configs, needClean)
		}

		baseACMEDomain := acmeServer.Spec.ACMEDomain

		// make sure full domain is right
		for domain, config := range issuer.Spec.DNS01.Configs {
			config.FullDomain = fmt.Sprintf("%s.%s", config.SubDomain, baseACMEDomain)
			issuer.Spec.DNS01.Configs[domain] = config
		}

		issuer.Spec.DNS01.BaseACMEDomain = baseACMEDomain

		err = r.Patch(r.ctx, &issuer, client.MergeFrom(copiedIssuer))
	}

	if err != nil {
		return err
	}

	// update status of certs using dnsIssuer
	err = r.updateStatusOfCertsUsingDNSIssuer(issuer)

	return err
}

func (r *ACMEServerReconciler) reconcileStatus(server corev1alpha1.ACMEServer) error {
	// check if lb-svc is assigned loadBalancer ip
	var svc corev1.Service
	err := r.Get(r.ctx, client.ObjectKey{
		Namespace: KalmSystemNamespace,
		Name:      GetNameForLoadBalanceServiceForNSDomain(),
	}, &svc)
	if err != nil {
		r.Log.Error(err, "fail to get lb-svc:"+GetNameForLoadBalanceServiceForNSDomain())
		return nil
	}

	ingList := svc.Status.LoadBalancer.Ingress
	if len(ingList) <= 0 || (ingList[0].IP == "" && ingList[0].Hostname == "") {
		r.Log.Info("loadBalancer IP for lb-svc not ready yet")

		server.Status.IPForNameServer = ""
		server.Status.Ready = false
	} else {
		// todo IP or hostname
		server.Status.IPForNameServer = firstNonEmpty(ingList[0].IP, ingList[0].Hostname)
		// todo more strict check
		server.Status.Ready = true
	}

	return r.Status().Update(r.ctx, &server)
}

func firstNonEmpty(strs ...string) string {
	for _, str := range strs {
		if str == "" {
			continue
		}

		return str
	}

	return ""
}

var ErrLBSvcForACMEServerNotReady = fmt.Errorf("LoadBalancer service for ACMEServer not ready yet")

func (r *ACMEServerReconciler) reconcileACMEComponent(acmeServer corev1alpha1.ACMEServer) error {
	// find if lb-svc IP is ready
	var lbSvc corev1.Service
	err := r.Get(r.ctx, client.ObjectKey{
		Namespace: KalmSystemNamespace,
		Name:      GetNameForLoadBalanceServiceForNSDomain(),
	}, &lbSvc)
	if err != nil {
		return err
	}

	lbIngress := lbSvc.Status.LoadBalancer.Ingress
	if len(lbIngress) <= 0 || (lbIngress[0].IP == "" && lbIngress[0].Hostname == "") {

		r.Log.Info("loadBalancer for ACME DNS not ready yet")
		return ErrLBSvcForACMEServerNotReady
	}

	// test if ip config for ns-acme.xxx is not necessary
	ip := lbSvc.Status.LoadBalancer.Ingress[0].IP
	// hostname := lbSvc.Status.LoadBalancer.Ingress[0].Hostname

	acmeDomain := acmeServer.Spec.ACMEDomain
	nsDomain := acmeServer.Spec.NSDomain

	acmeServerConfigContent := genContentForACMEServerConfig(acmeDomain, nsDomain, ip)

	var scList v1.StorageClassList
	if err := r.List(r.ctx, &scList); err != nil {
		return err
	}

	if len(scList.Items) <= 0 {
		return fmt.Errorf("no available storage class")
	}

	sc := pickStorageClass(scList)

	expectedComp := corev1alpha1.Component{
		ObjectMeta: ctrl.ObjectMeta{
			Namespace: KalmSystemNamespace,
			Name:      v1alpha1.ACMEServerName,
			Labels: map[string]string{
				"app": v1alpha1.ACMEServerName,
			},
		},
		Spec: corev1alpha1.ComponentSpec{
			Image: "joohoi/acme-dns:v0.8",
			Ports: []corev1alpha1.Port{
				{
					Protocol:      "udp",
					ContainerPort: 53,
					ServicePort:   53,
				},
				{
					Protocol:      "tcp",
					ContainerPort: 80,
					ServicePort:   80,
				},
			},
			Volumes: []corev1alpha1.Volume{
				{
					Path:             "/var/lib/acme-dns/",
					Size:             resource.MustParse("128Mi"),
					Type:             corev1alpha1.VolumeTypePersistentVolumeClaim,
					PVC:              "acmedns-sqlitedisk",
					StorageClassName: &sc.Name,
				},
			},
			PreInjectedFiles: []corev1alpha1.PreInjectFile{
				{
					Content:   acmeServerConfigContent,
					MountPath: "/etc/acme-dns/config.cfg",
					Readonly:  true,
				},
			},
			RestartStrategy: apps1.RecreateDeploymentStrategyType,
		},
	}

	isNew := false
	comp := corev1alpha1.Component{}

	err = r.Get(r.ctx, client.ObjectKey{Namespace: expectedComp.Namespace, Name: expectedComp.Name}, &comp)
	if err != nil {
		if errors.IsNotFound(err) {
			isNew = true
		} else {
			return err
		}
	}

	if isNew {
		comp := expectedComp
		err = ctrl.SetControllerReference(&acmeServer, &comp, r.Scheme)
		if err != nil {
			return err
		}

		// todo acquire a lock here to avoid multi-acme-server

		err = r.Create(r.ctx, &comp)
	} else {
		copied := comp.DeepCopy()
		copied.Spec = expectedComp.Spec

		err = r.Patch(r.ctx, copied, client.MergeFrom(&comp))
	}

	return err
}

func (r *ACMEServerReconciler) updateStatusOfCertsUsingDNSIssuer(httpsCertIssuer corev1alpha1.HttpsCertIssuer) error {
	dns01Certs, err := r.getCertsUsingDNSIssuer(r.ctx)
	if err != nil {
		return err
	}

	// update status of certs using dns01Issuer
	for i := range dns01Certs {
		cert := dns01Certs[i]

		if len(cert.Spec.Domains) <= 0 {
			continue
		}

		if cert.Status.WildcardCertDNSChallengeDomainMap == nil {
			cert.Status.WildcardCertDNSChallengeDomainMap = make(map[string]string)
		}

		trimmedDomains := trimPrefixOfWildcardDomains(cert.Spec.Domains)
		for _, domain := range trimmedDomains {
			config, exist := httpsCertIssuer.Spec.DNS01.Configs[domain]
			if !exist {
				continue
			}

			challengeDomain := fmt.Sprintf("%s.%s", config.SubDomain, httpsCertIssuer.Spec.DNS01.BaseACMEDomain)
			cert.Status.WildcardCertDNSChallengeDomainMap[domain] = challengeDomain
		}

		if err := r.Status().Update(r.ctx, &cert); err != nil {
			return err
		}
	}

	return nil
}

func sha1String(s string) string {
	h := sha1.New()
	h.Write([]byte(s))
	sha1Hash := hex.EncodeToString(h.Sum(nil))

	return sha1Hash
}
