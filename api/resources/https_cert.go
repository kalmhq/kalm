package resources

import (
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	coreV1 "k8s.io/api/core/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"strings"
	"sync"
)

type HttpsCert struct {
	//v1alpha1.HttpsCertSpec `json:",inline"`
	Name          string `json:"name"`
	IsSelfManaged bool   `json:"isSelfManaged"`

	SelfManagedCertContent string `json:"selfManagedCertContent,omitempty"`
	SelfManagedCertPrvKey  string `json:"selfManagedCertPrivateKey,omitempty"`

	HttpsCertIssuer string   `json:"httpsCertIssuer,omitempty"`
	Domains         []string `json:"domains,omitempty"`
}

type HttpsCertListChannel struct {
	List  chan []v1alpha1.HttpsCert
	Error chan error
}

func (builder *Builder) GetHttpsCerts() ([]HttpsCert, error) {
	rst := HttpsCertListChannel{
		List:  make(chan []v1alpha1.HttpsCert, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var fetched v1alpha1.HttpsCertList
		err := builder.K8sClient.RESTClient().Get().AbsPath("/apis/core.kapp.dev/v1alpha1/httpscerts").Do().Into(&fetched)
		res := make([]v1alpha1.HttpsCert, len(fetched.Items))

		for _, item := range fetched.Items {
			res = append(res, item)
		}

		rst.List <- res
		rst.Error <- err
	}()

	err := <-rst.Error
	if err != nil {
		return nil, err
	}

	list := <-rst.List

	var httpsCerts []HttpsCert
	for _, ele := range list {
		cur := HttpsCert{
			Name:          ele.Name,
			IsSelfManaged: ele.Spec.IsSelfManaged,
			Domains:       ele.Spec.Domains,
		}

		if !cur.IsSelfManaged {
			cur.HttpsCertIssuer = ele.Spec.HttpsCertIssuer
		} else {
			//todo show content of cert?
		}

		httpsCerts = append(httpsCerts, cur)
	}

	return httpsCerts, nil
}

func (builder *Builder) CreateAutoManagedHttpsCert(cert HttpsCert) (HttpsCert, error) {
	res := v1alpha1.HttpsCert{
		ObjectMeta: v1.ObjectMeta{
			Name: cert.Name,
		},
		Spec: v1alpha1.HttpsCertSpec{
			HttpsCertIssuer: cert.HttpsCertIssuer,
			Domains:         cert.Domains,
		},
	}

	err := builder.Create(&res)
	if err != nil {
		return HttpsCert{}, err
	}

	return cert, nil
}

func (builder *Builder) UpdateAutoManagedCert(cert HttpsCert) (HttpsCert, error) {
	var res v1alpha1.HttpsCert

	err := builder.Get("", cert.Name, &res)
	if err != nil {
		return HttpsCert{}, err
	}

	res.Spec.Domains = cert.Domains
	res.Spec.HttpsCertIssuer = cert.HttpsCertIssuer

	err = builder.Update(&res)
	if err != nil {
		return HttpsCert{}, err
	}

	return cert, nil
}

func (builder *Builder) UpdateSelfManagedCert(cert HttpsCert) (HttpsCert, error) {
	x509Cert, err := parseCert(cert.SelfManagedCertContent)
	if err != nil {
		builder.Logger.WithError(err).Errorf("fail to parse SelfManagedCertContent as cert")
		return HttpsCert{}, err
	}

	var err1 error
	wg1 := sync.WaitGroup{}
	wg1.Add(1)
	go func() {
		defer wg1.Done()

		// update sec
		var sec coreV1.Secret
		if err := builder.Get(nsIstioSystem, getSecNameForSelfManagedCert(cert), &sec); err != nil {
			err1 = err
			return
		}

		if sec.Data == nil {
			sec.Data = make(map[string][]byte)
		}

		// ensure secret content updated
		sec.Data["tls.crt"] = []byte(cert.SelfManagedCertContent)
		sec.Data["tls.key"] = []byte(cert.SelfManagedCertPrvKey)

		err1 = builder.Update(&sec)
	}()

	var err2 error
	wg2 := sync.WaitGroup{}
	wg2.Add(1)
	go func() {
		defer wg2.Done()

		// update domains
		var res v1alpha1.HttpsCert
		if err2 = builder.Get("", cert.Name, &res); err2 != nil {
			return
		}

		if strings.Join(res.Spec.Domains, ",") == strings.Join(x509Cert.DNSNames, ",") {
			return
		}

		// ensure domains updated
		res.Spec.Domains = x509Cert.DNSNames
		err2 = builder.Update(&res)
	}()

	wg1.Wait()
	wg2.Wait()

	if err1 != nil {
		return HttpsCert{}, err1
	} else if err2 != nil {
		return HttpsCert{}, err2
	}

	return cert, nil
}

func (builder *Builder) CreateSelfManagedHttpsCert(cert HttpsCert) (HttpsCert, error) {
	x509Cert, err := parseCert(cert.SelfManagedCertContent)
	if err != nil {
		builder.Logger.WithError(err).Errorf("fail to parse SelfManagedCertContent as cert")
		return HttpsCert{}, err
	}

	ok := checkPrivateKey(x509Cert, cert.SelfManagedCertPrvKey)
	if !ok {
		return HttpsCert{}, fmt.Errorf("privateKey and cert not match")
	}

	// create secret in istio-system
	certSecretName, err := builder.createCertSecretInNSIstioSystem(cert)
	if err != nil {
		return HttpsCert{}, err
	}

	res := v1alpha1.HttpsCert{
		ObjectMeta: v1.ObjectMeta{
			Name: cert.Name,
		},
		Spec: v1alpha1.HttpsCertSpec{
			IsSelfManaged:             true,
			SelfManagedCertSecretName: certSecretName,
			Domains:                   x509Cert.DNSNames,
		},
	}

	err = builder.Create(&res)
	if err != nil {
		return HttpsCert{}, err
	}

	return cert, nil
}

func checkPrivateKey(cert *x509.Certificate, prvKey string) bool {
	//todo check if cert & prvKey matches
	return true
}

func parseCert(certPEM string) (*x509.Certificate, error) {
	block, _ := pem.Decode([]byte(certPEM))
	if block == nil {
		panic("failed to parse certificate PEM")
	}
	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return nil, err
	}

	return cert, nil
}

func (builder *Builder) DeleteHttpsCert(name string) error {
	return builder.Delete(&v1alpha1.HttpsCert{ObjectMeta: v1.ObjectMeta{Name: name}})
}

const nsIstioSystem = "istio-system"

func getSecNameForSelfManagedCert(cert HttpsCert) string {
	certSecName := "kapp-self-managed-" + cert.Name
	return certSecName
}

func (builder *Builder) createCertSecretInNSIstioSystem(cert HttpsCert) (string, error) {

	certSecName := getSecNameForSelfManagedCert(cert)

	tlsCert := cert.SelfManagedCertContent
	tlsKey := cert.SelfManagedCertPrvKey

	certSec := coreV1.Secret{
		ObjectMeta: v1.ObjectMeta{
			//todo avoid conflict here
			Name:      certSecName,
			Namespace: nsIstioSystem,
		},
		Data: map[string][]byte{
			"tls.crt": []byte(tlsCert),
			"tls.key": []byte(tlsKey),
		},
	}

	err := builder.Create(&certSec)
	if err != nil {
		return "", err
	}

	return certSecName, nil
}
