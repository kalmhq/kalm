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

	logger := nsValidatorLog.WithValues("ns", req.Name, "UID", req.UID)
	logger.Info("ns webhook called")

	ns := corev1.Namespace{}

	// Code Review from david: @mingmin
	// How about using two functions to indicate CREATE and DELETE logic?
	// This advice is applicable for the other three built-in webhooks.

	// Get the object in the request
	if req.Operation == v1beta1.Create {
		err := v.decoder.Decode(req, &ns)
		if err != nil {
			return admission.Errored(http.StatusBadRequest, err)
		}

		// skip check for kalm system ns
		if v1alpha1.IsKalmSystemNamespace(ns.Name) {
			return admission.Allowed("")
		}

		// only check on kalmEnabled namespace
		if !v1alpha1.IsNamespaceKalmEnabled(ns) {
			return admission.Allowed("")
		}

		// Code Review from david: @mingmin
		// I don't agree to ban any namespace without a tenant label. Remember this webhook will run against Kubernetes API.
		// Any namespace that is created through our API will have a tenant label. This logic will work fine with those. But we should still allow new namespace creation through Kubernetes API.
		// For example, we may need to install some system-level namespaces by using kubectl directly, which should be allowed.
		// I suggest checking if the namespace has a kalm-enabled label.
		// Please take a look at https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/#matching-requests-objectselector
		// This advice is applicable for the other three built-in webhooks
		tenantName := ns.Labels[v1alpha1.TenantNameLabelKey]
		if tenantName == "" {
			return admission.Errored(http.StatusBadRequest, v1alpha1.NoTenantFoundError)
		}

		if err := v1alpha1.AllocateTenantResource(&ns, v1alpha1.ResourceApplicationsCount, resource.MustParse("1")); err != nil {
			logger.Error(err, "fail to allocate ns resource", "ns", ns.Name)
			return admission.Errored(http.StatusBadRequest, err)
		} else {
			logger.Info("succeeded to allocate ns resource", "ns", ns.Name)
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

		if !v1alpha1.IsNamespaceKalmEnabled(ns) {
			return admission.Allowed("")
		}

		tenantName := ns.Labels[v1alpha1.TenantNameLabelKey]
		if tenantName == "" {
			logger.Error(v1alpha1.NoTenantFoundError, "no tenant found in ns to be deleted, ignored", "ns", ns.Name)
			return admission.Allowed("")
		}

		if err := v1alpha1.ReleaseTenantResource(&ns, v1alpha1.ResourceApplicationsCount, resource.MustParse("1")); err != nil {
			logger.Error(err, "fail to release ns resource, ignored", "ns", ns.Name)
		}
	}

	return admission.Allowed("")
}

// InjectDecoder injects the decoder.
func (v *NSValidator) InjectDecoder(d *admission.Decoder) error {
	v.decoder = d
	return nil
}
