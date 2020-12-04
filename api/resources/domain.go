package resources

import "github.com/kalmhq/kalm/controller/api/v1alpha1"

type Domain struct {
	// Req
	Domain string `json:"domain"`
	// Resp
	Name       string `json:"name"`
	Status     string `json:"status"`
	RecordType string `json:"recordType"`
	Target     string `json:"target"`
	IsBuiltIn  bool   `json:"isBuiltIn"`
}

func WrapDomainAsResp(d v1alpha1.Domain) Domain {
	var status string
	if d.Status.IsDNSTargetConfigured {
		status = "ready"
	} else {
		status = "pending"
	}

	return Domain{
		Name:       d.Name,
		Domain:     d.Spec.Domain,
		Target:     d.Spec.DNSTarget,
		Status:     status,
		RecordType: string(d.Spec.DNSType),
		IsBuiltIn:  d.Spec.IsKalmBuiltinDomain,
	}
}

func WrapDomainListAsResp(list []v1alpha1.Domain) []Domain {
	rst := []Domain{}

	for _, d := range list {
		rst = append(rst, WrapDomainAsResp(d))
	}

	return rst
}
