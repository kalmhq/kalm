package resources

import (
	"fmt"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/kalmhq/kalm/controller/controllers"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type HttpsCertIssuer struct {
	Name           string                    `json:"name"`
	CAForTest      *v1alpha1.CAForTestIssuer `json:"caForTest,omitempty"`
	ACMECloudFlare *AccountAndSecret         `json:"acmeCloudFlare,omitempty"`
	HTTP01         *v1alpha1.HTTP01Issuer    `json:"http01,omitempty"`
}

type AccountAndSecret struct {
	Account string `json:"account"`
	Secret  string `json:"secret"`
}

func (resourceManager *ResourceManager) GetHttpsCertIssuerList() ([]HttpsCertIssuer, error) {
	var fetched v1alpha1.HttpsCertIssuerList
	if err := resourceManager.List(&fetched); err != nil {
		return nil, err
	}

	rst := make([]HttpsCertIssuer, 0, len(fetched.Items))
	for _, ele := range fetched.Items {
		issuer := HttpsCertIssuer{
			Name: ele.Name,
		}

		if ele.Spec.CAForTest != nil {
			issuer.CAForTest = ele.Spec.CAForTest
		}

		if ele.Spec.ACMECloudFlare != nil {
			issuer.ACMECloudFlare = &AccountAndSecret{
				Account: ele.Spec.ACMECloudFlare.Email,
				Secret:  "***", //won't show for list
			}
		}

		if ele.Spec.HTTP01 != nil {
			issuer.HTTP01 = ele.Spec.HTTP01
		}

		rst = append(rst, issuer)
	}

	return rst, nil
}

func GenerateSecretNameForACME(issuer HttpsCertIssuer) string {
	return "kalm-sec-acme-" + issuer.Name
}

func (resourceManager *ResourceManager) UpdateHttpsCertIssuer(hcIssuer HttpsCertIssuer) (HttpsCertIssuer, error) {
	var res v1alpha1.HttpsCertIssuer

	err := resourceManager.Get("", hcIssuer.Name, &res)
	if err != nil {
		return HttpsCertIssuer{}, err
	}

	if (res.Spec.CAForTest == nil) != (hcIssuer.CAForTest == nil) ||
		(res.Spec.ACMECloudFlare == nil) != (hcIssuer.ACMECloudFlare == nil) ||
		(res.Spec.HTTP01 == nil) != (hcIssuer.HTTP01 == nil) {
		return HttpsCertIssuer{}, fmt.Errorf("can not change type of HttpsCertIssuer")
	}

	res.Spec.CAForTest = hcIssuer.CAForTest
	res.Spec.HTTP01 = hcIssuer.HTTP01

	if hcIssuer.ACMECloudFlare != nil {

		secName := res.Spec.ACMECloudFlare.APITokenSecretName

		// reconcile secret content for acme, ignore if content is empty
		if hcIssuer.ACMECloudFlare.Secret != "" {
			secNs := controllers.CertManagerNamespace
			secContent := hcIssuer.ACMECloudFlare.Secret

			err := resourceManager.ReconcileSecretForIssuer(secNs, secName, secContent)
			if err != nil {
				return HttpsCertIssuer{}, err
			}
		}

		res.Spec.ACMECloudFlare = &v1alpha1.ACMECloudFlareIssuer{
			Email:              hcIssuer.ACMECloudFlare.Account,
			APITokenSecretName: secName,
		}
	}

	err = resourceManager.Update(&res)
	if err != nil {
		return HttpsCertIssuer{}, err
	}

	return hcIssuer, nil
}

func (resourceManager *ResourceManager) DeleteHttpsCertIssuer(name string) error {
	return resourceManager.Delete(&v1alpha1.HttpsCertIssuer{ObjectMeta: metaV1.ObjectMeta{Name: name}})
}

func (resourceManager *ResourceManager) ReconcileSecretForIssuer(secNs, secName string, secret string) error {
	expectedSec := coreV1.Secret{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      secName,
			Namespace: secNs,
			Labels: map[string]string{
				controllers.KalmLabelManaged: "true",
			},
		},
		Data: map[string][]byte{
			"content": []byte(secret),
		},
	}

	// check if exist
	sec, err := resourceManager.GetSecret(secNs, secName)
	if err != nil {
		if errors.IsNotFound(err) {
			sec := expectedSec
			return resourceManager.Create(&sec)
		}

		return err
	}

	sec.Data = expectedSec.Data
	sec.ObjectMeta.Labels = expectedSec.ObjectMeta.Labels

	return resourceManager.Update(&sec)
}
