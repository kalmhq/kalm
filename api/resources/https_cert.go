package resources

import (
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type HttpsCert struct {
	//v1alpha1.HttpsCertSpec `json:",inline"`
	Name          string `json:"name"`
	IsSelfManaged bool   `json:"isSelfManaged"`

	SelfManagedCertContent string `json:"selfManagedCertContent,omitempty"`
	SelfManagedCertPrvKey  string `json:"selfManagedCertPrivateKey,omitempty"`

	HttpsCertIssuer string   `json:"httpsCertIssuer,omitempty"`
	Domains         []string `json:"domains"`
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

func (builder *Builder) DeleteHttpsCert(name string) error {
	return builder.Delete(&v1alpha1.HttpsCert{ObjectMeta: v1.ObjectMeta{Name: name}})
}
