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
	"encoding/json"
	"fmt"
	"io/ioutil"
	corev1 "k8s.io/api/core/v1"
	v1 "k8s.io/api/storage/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/intstr"
	"net/http"
	"os"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
	"sort"
	"strings"

	corev1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
)

// ACMEServerReconciler reconciles a ACMEServer object
type ACMEServerReconciler struct {
	*BaseReconciler
	ctx context.Context
}

// +kubebuilder:rbac:groups=core.kalm.dev,resources=acmeservers,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kalm.dev,resources=acmeservers/status,verbs=get;update;patch

const ACMEServerName = "acme-server"

func (r *ACMEServerReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()
	_ = r.Log.WithValues("acmeserver", req.NamespacedName)

	acmeServerList := corev1alpha1.ACMEServerList{}
	if err := r.List(ctx, &acmeServerList); err != nil {
		return ctrl.Result{}, err
	}

	size := len(acmeServerList.Items)
	if size <= 0 {
		return ctrl.Result{}, nil
	} else if size > 1 {
		return ctrl.Result{}, fmt.Errorf("at most 1 cofig for acmeServer, see: %d", size)
	}

	acmeServer := acmeServerList.Items[0]

	acmeDomain := acmeServer.Spec.ACMEDomain
	//todo setup route for this domain
	//nsDomain := acmeServer.Spec.NSDomain

	acmeServerConfigContent := genContentForACMEServerConfig(acmeDomain)

	var scList v1.StorageClassList
	err := r.List(r.ctx, &scList)
	if err != nil {
		return ctrl.Result{}, err
	}

	if len(scList.Items) <= 0 {
		return ctrl.Result{}, fmt.Errorf("no available storage class")
	}

	sc := pickStorageClass(scList)

	expectedComp := corev1alpha1.Component{
		ObjectMeta: ctrl.ObjectMeta{
			Namespace: NamespaceKalmSystem,
			Name:      ACMEServerName,
			Labels: map[string]string{
				"app": ACMEServerName,
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
		},
	}

	isNew := false
	comp := corev1alpha1.Component{}

	err = r.Get(ctx, client.ObjectKey{Namespace: expectedComp.Namespace, Name: expectedComp.Name}, &comp)
	if err != nil {
		if errors.IsNotFound(err) {
			isNew = true
		} else {
			return ctrl.Result{}, err
		}
	}

	if isNew {
		comp := expectedComp
		err = ctrl.SetControllerReference(&acmeServer, &comp, r.Scheme)
		if err != nil {
			return ctrl.Result{}, err
		}

		// todo acquire a lock here to avoid multi-acme-server

		err = r.Create(ctx, &comp)
	} else {
		comp.Spec = expectedComp.Spec
		err = r.Update(ctx, &comp)
	}

	if err != nil {
		return ctrl.Result{}, err
	}

	// reconcile LoadBalancer Service for NSDomain
	if err := r.reconcileLoadBalanceServiceForNSDomain(acmeServer); err != nil {
		return ctrl.Result{}, err
	}

	if err := r.reconcileIssuer(acmeServer); err != nil {
		return ctrl.Result{}, err
	}

	if err := r.reconcileStatus(acmeServer); err != nil {
		return ctrl.Result{}, err
	}

	return ctrl.Result{}, err
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

func genContentForACMEServerConfig(domain string) string {
	template := `
[general]
# DNS interface. Note that systemd-resolved may reserve port 53 on 127.0.0.53
# In this case acme-dns will error out and you will need to define the listening interface
# for example: listen = "127.0.0.1:53"
listen = "0.0.0.0:53"
# protocol, "both", "both4", "both6", "udp", "udp4", "udp6" or "tcp", "tcp4", "tcp6"
protocol = "both"
# domain name to serve the requests off of
domain = "DOMAIN_PLACEHOLDER"
# zone name server
nsname = "DOMAIN_PLACEHOLDER"
# admin email address, where @ is substituted with .
#nsadmin = "admin.example.org"
# predefined records served in addition to the TXT
#records = [
#    # domain pointing to the public IP of your acme-dns server 
#    "acme.example.xyz. A 1.2.3.4",
#    # specify that acme.example.xyz will resolve any *.acme.example.xyz records
#    "acme.example.xyz. NS acme.example.xyz.",
#]
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

	return strings.ReplaceAll(template, "DOMAIN_PLACEHOLDER", domain)
}

func (r *ACMEServerReconciler) getCertsUsingDNSIssuer(
	ctx context.Context) (rst []corev1alpha1.HttpsCert, err error) {

	var httpsCertList corev1alpha1.HttpsCertList
	err = r.List(ctx, &httpsCertList)
	if err != nil {
		return nil, err
	}

	for _, cert := range httpsCertList.Items {
		if cert.Spec.HttpsCertIssuer != DefaultDNS01IssuerName {
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
		host = fmt.Sprintf("%s.%s.svc.cluster.local", ACMEServerName, NamespaceKalmSystem)
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
			return nil, err
		}

		bytes, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}

		config := corev1alpha1.DNS01IssuerConfig{}
		if err := json.Unmarshal(bytes, &config); err != nil {
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

	if cert.Spec.HttpsCertIssuer != DefaultDNS01IssuerName {
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
	if object.Meta.GetName() != ACMEServerName {
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
	if object.Meta.GetNamespace() != NamespaceKalmSystem ||
		object.Meta.GetName() != getNameForLoadBalanceServiceForNSDomain() {
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

func (r *ACMEServerReconciler) updateConfigsForIssuer(
	issuer *corev1alpha1.HttpsCertIssuer,
) error {

	dns01Certs, err := r.getCertsUsingDNSIssuer(r.ctx)
	if err != nil {
		return err
	}

	var needRegisterDomains []string
	for _, dns01Cert := range dns01Certs {
		domains := dns01Cert.Spec.Domains
		if len(domains) <= 0 {
			continue
		}

		// todo add check in webhook
		// for dns cert, only 1 domain is permitted (and without: *)
		domain := domains[0]
		if _, exist := issuer.Spec.DNS01.Configs[domain]; !exist {
			needRegisterDomains = append(needRegisterDomains, domain)
		}
	}

	r.Log.Info("updateConfigsForIssuer", "needRegisterDomains", needRegisterDomains)

	domainConfigMap, err := r.registerACMEDNS(needRegisterDomains)
	if err != nil {
		r.Log.Error(err, "fail to registerACMEDNS")
		return err
	}

	if issuer.Spec.DNS01.Configs == nil {
		issuer.Spec.DNS01.Configs = make(map[string]corev1alpha1.DNS01IssuerConfig)
	}

	for domain, config := range domainConfigMap {
		// both example.com & *.example.com is needed
		issuer.Spec.DNS01.Configs[domain] = config
		issuer.Spec.DNS01.Configs["*."+domain] = config
	}

	// update status of certs using dns01Issuer
	for _, cert := range dns01Certs {
		if len(cert.Spec.Domains) <= 0 {
			continue
		}

		domain := cert.Spec.Domains[0]
		config, exist := issuer.Spec.DNS01.Configs[domain]
		if !exist {
			continue
		}

		cert.Status.WildcardCertDNSChallengeDomain = config.FullDomain
		if err := r.Status().Update(r.ctx, &cert); err != nil {
			return err
		}
	}

	return nil
}

func getNameForLoadBalanceServiceForNSDomain() string {
	return "lb-svc-" + ACMEServerName
}

func (r *ACMEServerReconciler) reconcileLoadBalanceServiceForNSDomain(acmeServer corev1alpha1.ACMEServer) error {
	expectedLBService := corev1.Service{
		ObjectMeta: ctrl.ObjectMeta{
			Namespace: NamespaceKalmSystem,
			Name:      getNameForLoadBalanceServiceForNSDomain(),
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
				"app": ACMEServerName,
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
		svc.Spec = expectedLBService.Spec
		err = r.Update(r.ctx, &svc)
	}

	return err
}

func (r *ACMEServerReconciler) reconcileIssuer(acmeServer corev1alpha1.ACMEServer) error {
	// reconcile companion issuer
	issuer := corev1alpha1.HttpsCertIssuer{}
	isNew := false

	err := r.Get(r.ctx, client.ObjectKey{Name: DefaultDNS01IssuerName}, &issuer)
	if err != nil {
		if errors.IsNotFound(err) {
			isNew = true

			issuer.ObjectMeta = ctrl.ObjectMeta{
				Name: DefaultDNS01IssuerName,
			}

			issuer = corev1alpha1.HttpsCertIssuer{
				ObjectMeta: ctrl.ObjectMeta{
					Name: DefaultDNS01IssuerName,
				},
				Spec: corev1alpha1.HttpsCertIssuerSpec{
					DNS01: &corev1alpha1.DNS01Issuer{},
				},
			}
		} else {
			return err
		}
	}

	if err := r.updateConfigsForIssuer(&issuer); err != nil {
		return err
	}

	if isNew {
		if err := ctrl.SetControllerReference(&acmeServer, &issuer, r.Scheme); err != nil {
			return err
		}

		err = r.Create(r.ctx, &issuer)
	} else {
		err = r.Update(r.ctx, &issuer)
	}

	return err
}

func (r *ACMEServerReconciler) reconcileStatus(server corev1alpha1.ACMEServer) error {
	// check if lb-svc is assigned loadBalancer ip
	var svc corev1.Service
	err := r.Get(r.ctx, client.ObjectKey{
		Namespace: NamespaceKalmSystem,
		Name:      getNameForLoadBalanceServiceForNSDomain(),
	}, &svc)
	if err != nil {
		r.Log.Error(err, "fail to get lb-svc:"+getNameForLoadBalanceServiceForNSDomain())
	}

	ingList := svc.Status.LoadBalancer.Ingress
	if len(ingList) <= 0 || ingList[0].IP == "" {
		r.Log.Info("loadBalancer IP for lb-svc not ready yet")

		server.Status.IPForNameServer = ""
		server.Status.Ready = false
	} else {
		server.Status.IPForNameServer = ingList[0].IP
		// todo more strict check
		server.Status.Ready = true
	}

	return r.Status().Update(r.ctx, &server)
}
