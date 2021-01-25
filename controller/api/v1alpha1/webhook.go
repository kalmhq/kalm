package v1alpha1

var sysNamespaceMap = map[string]interface{}{
	"kalm-system":    true,
	"kalm-operator":  true,
	"istio-system":   true,
	"istio-operator": true,
	"cert-manager":   true,
}

func IsKalmSystemNamespace(ns string) bool {
	_, exist := sysNamespaceMap[ns]
	return exist
}
