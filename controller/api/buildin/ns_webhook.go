package buildin

import (
	"context"
	"fmt"
	"net/http"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	"sigs.k8s.io/controller-runtime/pkg/webhook/admission"
)

// +kubebuilder:webhook:verbs=create;update;delete,path=/validate-v1-ns,mutating=false,failurePolicy=fail,groups="",resources=namespaces,versions=v1,name=vns.kb.io

// NSValidator validates Namespaces
// ref: https://github.com/kubernetes-sigs/controller-runtime/blob/v0.2.0/examples/builtins/validatingwebhook.go
type NSValidator struct {
	decoder *admission.Decoder
}

var _ admission.Handler = &NSValidator{}
var _ admission.DecoderInjector = &NSValidator{}

// NSValidator admits a namespace if a tenant label exists.
func (v *NSValidator) Handle(ctx context.Context, req admission.Request) admission.Response {

	fmt.Println("ns webhook called")

	ns := corev1.Namespace{}

	err := v.decoder.Decode(req, &ns)
	if err != nil {
		return admission.Errored(http.StatusBadRequest, err)
	}

	if isKalmSystemNamespace(ns) {
		return admission.Allowed("")
	}

	if err := v1alpha1.AllocateTenantResource(&ns, v1alpha1.ResourceApplicationsCount, resource.MustParse("1")); err != nil {
		return admission.Errored(http.StatusBadRequest, err)
	}

	return admission.Allowed("")
}

var sysNamespaceMap = map[string]interface{}{
	"kalm-system":   true,
	"kalm-operator": true,
}

func isKalmSystemNamespace(ns corev1.Namespace) bool {
	_, exist := sysNamespaceMap[ns.Name]
	return exist
}

// InjectDecoder injects the decoder.
func (v *NSValidator) InjectDecoder(d *admission.Decoder) error {
	v.decoder = d
	return nil
}
