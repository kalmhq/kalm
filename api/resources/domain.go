package resources

import "github.com/kalmhq/kalm/controller/api/v1alpha1"

type Domain struct {
	Name       string `json:"name"`
	Domain     string `json:"domain"`
	RecordType string `json:"recordType"`
	Target     string `json:"target"`
}

func WrapDomainAsResp(d v1alpha1.Domain) Domain {
	return Domain{
		Name:       d.Name,
		Domain:     d.Spec.Domain,
		RecordType: string(d.Spec.DNSType),
		Target:     d.Spec.DNSTarget,
	}
}

func WrapDomainListAsResp(list []v1alpha1.Domain) []Domain {
	rst := []Domain{}

	for _, d := range list {
		rst = append(rst, WrapDomainAsResp(d))
	}

	return rst
}
