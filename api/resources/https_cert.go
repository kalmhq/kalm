package resources

import (
	"crypto/rsa"
	"crypto/x509"
	"fmt"
	"strings"
	"sync"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/kalmhq/kalm/controller/controllers"
	"go.uber.org/zap"
	"golang.org/x/crypto/ssh"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/rand"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type HttpsCert struct {
	Name          string `json:"name"`
	IsSelfManaged bool   `json:"isSelfManaged"`

	SelfManagedCertContent string `json:"selfManagedCertContent,omitempty"`
	SelfManagedCertPrvKey  string `json:"selfManagedCertPrivateKey,omitempty"`

	HttpsCertIssuer string   `json:"httpsCertIssuer,omitempty"`
	Domains         []string `json:"domains,omitempty"`
}

type HttpsCertResp struct {
	HttpsCert                         `json:",inline"`
	Ready                             string            `json:"ready"`
	Reason                            string            `json:"reason"`
	IsSignedByPublicTrustedCA         bool              `json:"isSignedByTrustedCA,omitempty"`
	ExpireTimestamp                   int64             `json:"expireTimestamp,omitempty"`
	WildcardCertDNSChallengeDomainMap map[string]string `json:"wildcardCertDNSChallengeDomainMap,omitempty"`
}

var ReasonForNoReadyConditions = "no feedback on cert status yet"

func BuildHttpsCertResponse(httpsCert *v1alpha1.HttpsCert) *HttpsCertResp {
	var readyCond *v1alpha1.HttpsCertCondition
	for i := range httpsCert.Status.Conditions {
		cond := httpsCert.Status.Conditions[i]

		if cond.Type != v1alpha1.HttpsCertConditionReady {
			continue
		}

		readyCond = &cond
		break
	}

	var ready, reason string
	if readyCond == nil {
		ready = string(v1.ConditionUnknown)
		reason = ReasonForNoReadyConditions
	} else {
		ready = string(readyCond.Status)
		reason = readyCond.Message
	}

	resp := HttpsCertResp{
		HttpsCert: HttpsCert{
			Name:          httpsCert.Name,
			IsSelfManaged: httpsCert.Spec.IsSelfManaged,
			Domains:       httpsCert.Spec.Domains,
		},
		Ready:  ready,
		Reason: reason,
	}

	if readyCond != nil && readyCond.Status == coreV1.ConditionTrue {
		isSignedByTrustedCA := httpsCert.Status.IsSignedByPublicTrustedCA
		expireTimestamp := httpsCert.Status.ExpireTimestamp

		resp.IsSignedByPublicTrustedCA = isSignedByTrustedCA
		resp.ExpireTimestamp = expireTimestamp
	}

	if !resp.IsSelfManaged {
		resp.HttpsCertIssuer = httpsCert.Spec.HttpsCertIssuer
	} else {
		//todo show content of cert?
	}

	resp.WildcardCertDNSChallengeDomainMap = httpsCert.Status.WildcardCertDNSChallengeDomainMap

	return &resp
}

func (resourceManager *ResourceManager) GetHttpsCert(name string) (*v1alpha1.HttpsCert, error) {
	var fetched v1alpha1.HttpsCert

	if err := resourceManager.Get("", name, &fetched); err != nil {
		return nil, err
	}

	return &fetched, nil
}

func (resourceManager *ResourceManager) GetHttpsCerts(options ...client.ListOption) ([]*HttpsCertResp, error) {
	var fetched v1alpha1.HttpsCertList

	if err := resourceManager.List(&fetched, options...); err != nil {
		return nil, err
	}

	var httpsCerts []*HttpsCertResp
	for i := range fetched.Items {
		item := fetched.Items[i]
		cur := BuildHttpsCertResponse(&item)
		httpsCerts = append(httpsCerts, cur)
	}

	return httpsCerts, nil
}

func (resourceManager *ResourceManager) CreateAutoManagedHttpsCert(cert *HttpsCert) (*HttpsCertResp, error) {

	// by default, cert use our default http01Issuer
	if cert.HttpsCertIssuer == "" {
		cert.HttpsCertIssuer = v1alpha1.DefaultHTTP01IssuerName
	}

	if cert.Name == "" {
		maxCnt := 5
		for cnt := 0; cnt < maxCnt; cnt++ {
			name := autoGenCertName(cert)

			// check if exist
			existCert := v1alpha1.HttpsCert{}
			err := resourceManager.Get("", name, &existCert)
			if errors.IsNotFound(err) {
				cert.Name = name
				break
			}
		}
	}

	// if cert name still empty
	if cert.Name == "" {
		return nil, fmt.Errorf("fail to generate name for HttpsCert, please retry")
	}

	res := v1alpha1.HttpsCert{
		ObjectMeta: v1.ObjectMeta{
			Name: cert.Name,
		},
		Spec: v1alpha1.HttpsCertSpec{
			HttpsCertIssuer: cert.HttpsCertIssuer,
			Domains:         cert.Domains,
		},
	}

	err := resourceManager.Create(&res)

	if err != nil {
		return nil, err
	}

	return BuildHttpsCertResponse(&res), nil
}

func autoGenCertName(cert *HttpsCert) string {
	var prefix string

	switch cert.HttpsCertIssuer {
	case v1alpha1.DefaultDNS01IssuerName:
		prefix = "dns01-"
	case v1alpha1.DefaultHTTP01IssuerName:
		prefix = "http01-"
	}

	if cert.IsSelfManaged {
		prefix = "uploaded-"
	}

	return fmt.Sprintf("%s%s", prefix, rand.String(8))
}

func (resourceManager *ResourceManager) UpdateAutoManagedCert(cert *HttpsCert) (*HttpsCert, error) {
	var res v1alpha1.HttpsCert

	err := resourceManager.Get("", cert.Name, &res)
	if err != nil {
		return nil, err
	}

	res.Spec.Domains = cert.Domains
	res.Spec.HttpsCertIssuer = cert.HttpsCertIssuer

	err = resourceManager.Update(&res)
	if err != nil {
		return nil, err
	}

	return cert, nil
}

func (resourceManager *ResourceManager) UpdateSelfManagedCert(cert *HttpsCert) (*HttpsCertResp, error) {
	x509Cert, _, err := controllers.ParseCert(cert.SelfManagedCertContent)

	if err != nil {
		resourceManager.Logger.Error("fail to parse SelfManagedCertContent as cert", zap.Error(err))
		return nil, err
	}

	domains := getDomainsInCert(x509Cert)
	if len(domains) <= 0 {
		return nil, fmt.Errorf("fail to find domain name in cert")
	}

	var err1 error
	wg1 := sync.WaitGroup{}
	wg1.Add(1)
	go func() {
		defer wg1.Done()

		// update sec
		var sec coreV1.Secret
		if err := resourceManager.Get(nsIstioSystem, cert.Name, &sec); err != nil {
			err1 = err
			return
		}

		if sec.Data == nil {
			sec.Data = make(map[string][]byte)
		}

		// ensure secret content updated
		sec.Data["tls.crt"] = []byte(cert.SelfManagedCertContent)
		sec.Data["tls.key"] = []byte(cert.SelfManagedCertPrvKey)

		err1 = resourceManager.Update(&sec)
	}()

	var res v1alpha1.HttpsCert
	var err2 error
	wg2 := sync.WaitGroup{}
	wg2.Add(1)
	go func() {
		defer wg2.Done()

		// update domains
		if err2 = resourceManager.Get("", cert.Name, &res); err2 != nil {
			return
		}

		if strings.Join(res.Spec.Domains, ",") == strings.Join(domains, ",") {
			return
		}

		// ensure domains updated
		res.Spec.Domains = x509Cert.DNSNames
		err2 = resourceManager.Update(&res)
	}()

	wg1.Wait()
	wg2.Wait()

	if err1 != nil {
		return nil, err1
	} else if err2 != nil {
		return nil, err2
	}

	return BuildHttpsCertResponse(&res), nil
}

func (resourceManager *ResourceManager) CreateSelfManagedHttpsCert(cert *HttpsCert) (*HttpsCertResp, error) {
	x509Cert, _, err := controllers.ParseCert(cert.SelfManagedCertContent)

	if cert.Name == "" {
		cert.Name = autoGenCertName(cert)
	}

	if err != nil {
		resourceManager.Logger.Error("fail to parse SelfManagedCertContent as cert", zap.Error(err))
		return nil, err
	}

	domains := getDomainsInCert(x509Cert)

	if len(domains) <= 0 {
		return nil, fmt.Errorf("fail to find domain name in cert")
	}

	pki, err := ssh.ParseRawPrivateKey([]byte(cert.SelfManagedCertPrvKey))

	if err != nil {
		return nil, err
	}

	rsaPrivateKey, ok := pki.(*rsa.PrivateKey)

	if !ok {
		return nil, fmt.Errorf("Only support RSA algorithm in private key")
	}

	rsaPublicKey, ok := x509Cert.PublicKey.(*rsa.PublicKey)

	if !ok {
		return nil, fmt.Errorf("Only support RSA algorithm in public key")
	}

	if rsaPrivateKey.PublicKey.N.Cmp(rsaPublicKey.N) != 0 ||
		rsaPrivateKey.PublicKey.E != rsaPublicKey.E {
		return nil, fmt.Errorf("Private key and cert not match")
	}

	// create secret in istio-system
	certSecretName, err := resourceManager.createCertSecretInNSIstioSystem(cert)

	if err != nil {
		return nil, err
	}

	res := v1alpha1.HttpsCert{
		ObjectMeta: v1.ObjectMeta{
			Name: cert.Name,
		},
		Spec: v1alpha1.HttpsCertSpec{
			IsSelfManaged:             true,
			SelfManagedCertSecretName: certSecretName,
			Domains:                   domains,
		},
	}

	err = resourceManager.Create(&res)

	if err != nil {
		return nil, err
	}

	return BuildHttpsCertResponse(&res), nil
}

func getDomainsInCert(x509Cert *x509.Certificate) []string {
	var domains []string
	if len(x509Cert.DNSNames) > 0 {
		domains = x509Cert.DNSNames
	} else if x509Cert.Subject.CommonName != "" {
		domains = []string{x509Cert.Subject.CommonName}
	}

	return domains
}

func (resourceManager *ResourceManager) DeleteHttpsCert(name string) error {
	return resourceManager.Delete(&v1alpha1.HttpsCert{ObjectMeta: v1.ObjectMeta{Name: name}})
}

const nsIstioSystem = "istio-system"

func (resourceManager *ResourceManager) createCertSecretInNSIstioSystem(cert *HttpsCert) (string, error) {
	tlsCert := cert.SelfManagedCertContent
	tlsKey := cert.SelfManagedCertPrvKey

	certSec := coreV1.Secret{
		ObjectMeta: v1.ObjectMeta{
			Name:      cert.Name,
			Namespace: nsIstioSystem,
		},
		Data: map[string][]byte{
			"tls.crt": []byte(tlsCert),
			"tls.key": []byte(tlsKey),
		},
	}

	err := resourceManager.Create(&certSec)
	if err != nil {
		return "", err
	}

	return cert.Name, nil
}
