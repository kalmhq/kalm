package resources

import (
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type HttpsCertIssuerListChannel struct {
	List  chan []v1alpha1.HttpsCertIssuer
	Error chan error
}

func (builder *Builder) GetHttpsCertIssuerListChan() *HttpsCertIssuerListChannel {
	rst := HttpsCertIssuerListChannel{
		List:  make(chan []v1alpha1.HttpsCertIssuer, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var fetched v1alpha1.HttpsCertIssuerList
		err := builder.K8sClient.RESTClient().Get().AbsPath("/apis/core.kapp.dev/v1alpha1/httpscertissuers").Do().Into(&fetched)
		res := make([]v1alpha1.HttpsCertIssuer, len(fetched.Items))

		for _, item := range fetched.Items {
			res = append(res, item)
		}

		rst.List <- res
		rst.Error <- err
	}()

	return &rst
}

type HttpsCertIssuer struct {
	v1alpha1.HttpsCertIssuerSpec `json:",inline"`
	Name                         string `json:"name"`
}

func (builder *Builder) GetHttpsCertIssuerList() ([]HttpsCertIssuer, error) {
	resourceChannels := &ResourceChannels{
		HttpsCertIssuerList: builder.GetHttpsCertIssuerListChan(),
	}

	resources, err := resourceChannels.ToResources()
	if err != nil {
		builder.Logger.Error(err)
		return nil, err
	}

	var rst []HttpsCertIssuer
	for _, ele := range resources.HttpsCertIssuers {
		rst = append(rst, HttpsCertIssuer{
			HttpsCertIssuerSpec: ele.Spec,
			Name:                ele.Name,
		})
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
