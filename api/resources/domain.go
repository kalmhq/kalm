package resources

import "github.com/kalmhq/kalm/controller/api/v1alpha1"

type Domain struct {
	// Req
	Domain string `json:"domain"`

	// Resp
	Name      string `json:"name"`
	IsBuiltIn bool   `json:"isBuiltIn"`

	// A or CNAME record
	Status     string `json:"status"`
	RecordType string `json:"recordType"`
	Target     string `json:"target"`

	// TXT record
	Txt       string `json:"txt"`
	TxtStatus string `json:"txtStatus"`

	DNSTargetReadyToCheck bool `json:"dnsTargetReadyToCheck"`
	TxtReadyToCheck       bool `json:"txtReadyToCheck"`
}

func WrapDomainAsResp(d v1alpha1.Domain) Domain {
	var targetStatus string
	if d.Status.IsDNSTargetConfigured {
		targetStatus = "ready"
	} else {
		targetStatus = "pending"
	}

	var txtStatus string
	if d.Status.IsTxtConfigured {
		txtStatus = "ready"
	} else {
		txtStatus = "pending"
	}

	return Domain{
		Name:                  d.Name,
		Domain:                d.Spec.Domain,
		Target:                d.Spec.DNSTarget,
		Status:                targetStatus,
		RecordType:            string(d.Spec.DNSType),
		IsBuiltIn:             d.Spec.IsKalmBuiltinDomain,
		Txt:                   d.Spec.Txt,
		TxtStatus:             txtStatus,
		DNSTargetReadyToCheck: d.Spec.DNSTargetReadyToCheck,
		TxtReadyToCheck:       d.Spec.TxtReadyToCheck,
	}
}

func WrapDomainListAsResp(list []v1alpha1.Domain) []Domain {
	rst := []Domain{}

	for _, d := range list {
		rst = append(rst, WrapDomainAsResp(d))
	}

	return rst
}
