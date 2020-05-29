package resources

import (
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type HttpsCertIssuer struct {
	v1alpha1.HttpsCertIssuerSpec `json:",inline"`
	Name                         string `json:"name"`
}

func (builder *Builder) GetHttpsCertIssuerList() ([]HttpsCertIssuer, error) {
	var fetched v1alpha1.HttpsCertIssuerList
	if err := builder.List(&fetched); err != nil {
		return nil, err
	}

	rst := make([]HttpsCertIssuer, len(fetched.Items))
	for i, ele := range fetched.Items {
		rst[i] = HttpsCertIssuer{
			HttpsCertIssuerSpec: ele.Spec,
			Name:                ele.Name,
		}
	}

	return rst, nil
}

func (builder *Builder) UpdateHttpsCertIssuer(hcIssuer HttpsCertIssuer) (HttpsCertIssuer, error) {
	var res v1alpha1.HttpsCertIssuer

	err := builder.Get("", hcIssuer.Name, &res)
	if err != nil {
		return HttpsCertIssuer{}, err
	}

	res.Spec.ACMECloudFlare = hcIssuer.ACMECloudFlare
	res.Spec.CAForTest = hcIssuer.CAForTest

	err = builder.Update(&res)
	if err != nil {
		return HttpsCertIssuer{}, err
	}

	return hcIssuer, nil
}

func (builder *Builder) DeleteHttpsCertIssuer(name string) error {
	return builder.Delete(&v1alpha1.HttpsCertIssuer{ObjectMeta: metaV1.ObjectMeta{Name: name}})
}
