package builtin

import (
	"context"
	"net/http"

	"k8s.io/api/admission/v1beta1"
	"k8s.io/apimachinery/pkg/api/resource"
	"sigs.k8s.io/controller-runtime/pkg/client"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/runtime/inject"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	corev1 "k8s.io/api/core/v1"
	"sigs.k8s.io/controller-runtime/pkg/webhook/admission"
)

var pvAdmissionHandlerLog = logf.Log.WithName("pv-admission-handler")

// +kubebuilder:webhook:verbs=create;update;delete,path=/admission-handler-v1-pv,mutating=false,failurePolicy=fail,groups="",resources=persistentvolumes,versions=v1,name=vpv.kb.io

// webhook for PV
type PVAdmissionHandler struct {
	client  client.Client
	decoder *admission.Decoder
}

var _ admission.Handler = &PVAdmissionHandler{}

var _ admission.DecoderInjector = &PVAdmissionHandler{}
var _ inject.Client = &PVAdmissionHandler{}

func (v *PVAdmissionHandler) Handle(ctx context.Context, req admission.Request) admission.Response {

	pvAdmissionHandlerLog.Info("pv admission handler called")

	pv := corev1.PersistentVolume{}

	// currently only deal with delete
	if req.Operation == v1beta1.Delete {
		err := v.decoder.DecodeRaw(req.OldObject, &pv)
		if err != nil {
			return admission.Errored(http.StatusBadRequest, err)
		}

		pvAdmissionHandlerLog.Info("pv being deleted", "pv", pv.Name)

		pvTenant := pv.Labels[v1alpha1.TenantNameLabelKey]
		if pvTenant == "" {
			return admission.Allowed("")
		}

		var tenantPVList corev1.PersistentVolumeList
		if err := v.client.List(ctx, &tenantPVList, client.MatchingLabels{
			v1alpha1.TenantNameLabelKey: pvTenant,
		}); err != nil {
			return admission.Errored(http.StatusBadRequest, err)
		}

		var size resource.Quantity
		for _, tmpPV := range tenantPVList.Items {
			// ignore pv been deleted
			if tmpPV.Name == pv.Name {
				continue
			}

			size.Add(*pv.Spec.Capacity.Storage())
		}

		if err := v1alpha1.SetTenantResourceByName(pvTenant, v1alpha1.ResourceStorage, size); err != nil {
			return admission.Errored(http.StatusBadRequest, err)
		}

		pvAdmissionHandlerLog.Info("pv occupation updated", "tenant", pvTenant, "newOccupation", size)
	}

	return admission.Allowed("")
}

// InjectDecoder injects the decoder.
func (v *PVAdmissionHandler) InjectDecoder(d *admission.Decoder) error {
	v.decoder = d
	return nil
}

func (v *PVAdmissionHandler) InjectClient(c client.Client) error {
	v.client = c
	return nil
}
