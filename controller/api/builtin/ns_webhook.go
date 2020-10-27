package builtin

import (
	"context"
	"net/http"

	"k8s.io/api/admission/v1beta1"
	logf "sigs.k8s.io/controller-runtime/pkg/log"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	"sigs.k8s.io/controller-runtime/pkg/webhook/admission"
)

var nsValidatorLog = logf.Log.WithName("ns-validator")

// +kubebuilder:webhook:verbs=create;update;delete,path=/validate-v1-ns,mutating=false,failurePolicy=fail,groups="",resources=namespaces,versions=v1,name=vns.kb.io

// NSValidator validates Namespaces
// ref: https://github.com/kubernetes-sigs/controller-runtime/blob/v0.2.0/examples/builtins/validatingwebhook.go
type NSValidator struct {
	decoder *admission.Decoder
}

var _ admission.Handler = &NSValidator{}
var _ admission.DecoderInjector = &NSValidator{}

// NSValidator admits a namespace if a tenant label exists.
// ref: https://github.com/kubernetes-sigs/controller-runtime/blob/master/pkg/webhook/admission/validator.go#L59
func (v *NSValidator) Handle(ctx context.Context, req admission.Request) admission.Response {

	nsValidatorLog.Info("ns webhook called")

	ns := corev1.Namespace{}

	// Get the object in the request
	if req.Operation == v1beta1.Create {
		err := v.decoder.Decode(req, &ns)
		if err != nil {
			return admission.Errored(http.StatusBadRequest, err)
		}

		if v1alpha1.IsKalmSystemNamespace(ns.Name) {
			return admission.Allowed("")
		}

		tenant := ns.Labels[v1alpha1.TenantNameLabelKey]
		if tenant == "" {
			return admission.Errored(http.StatusBadRequest, v1alpha1.NoTenantFoundError)
		}

		if err := v1alpha1.AllocateTenantResource(&ns, v1alpha1.ResourceApplicationsCount, resource.MustParse("1")); err != nil {
			return admission.Errored(http.StatusBadRequest, err)
		}
	}

	if req.Operation == v1beta1.Delete {
		// In reference to PR: https://github.com/kubernetes/kubernetes/pull/76346
		// OldObject contains the object being deleted
		err := v.decoder.DecodeRaw(req.OldObject, &ns)
		if err != nil {
			return admission.Errored(http.StatusBadRequest, err)
		}

		if v1alpha1.IsKalmSystemNamespace(ns.Name) {
			return admission.Allowed("")
		}

		tenant := ns.Labels[v1alpha1.TenantNameLabelKey]
		if tenant == "" {
			return admission.Errored(http.StatusBadRequest, v1alpha1.NoTenantFoundError)
		}

		if err := v1alpha1.ReleaseTenantResource(&ns, v1alpha1.ResourceApplicationsCount, resource.MustParse("1")); err != nil {
			return admission.Errored(http.StatusBadRequest, err)
		}
	}

	return admission.Allowed("")
}

// InjectDecoder injects the decoder.
func (v *NSValidator) InjectDecoder(d *admission.Decoder) error {
	v.decoder = d
	return nil
}
