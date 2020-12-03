package resources

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
