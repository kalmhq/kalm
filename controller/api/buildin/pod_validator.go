package buildin

import (
	"context"
	"fmt"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/webhook/admission"
)

// +kubebuilder:webhook:path=/validate-v1-pod,mutating=false,failurePolicy=fail,groups="",resources=pods,verbs=create;update,versions=v1,name=vpod.kb.io

// PodValidator validates Pods
type PodValidator struct {
	Client  client.Client
	decoder *admission.Decoder
}

// podValidator admits a pod iff a specific annotation exists.
func (v *PodValidator) Handle(ctx context.Context, req admission.Request) admission.Response {

	fmt.Println("inside pod validator")

	//pod := &corev1.Pod{}
	//
	//err := v.decoder.Decode(req, pod)
	//if err != nil {
	//	return admission.Errored(http.StatusBadRequest, err)
	//}
	//
	//key := "example-mutating-admission-webhook"
	//anno, found := pod.Annotations[key]
	//if !found {
	//	return admission.Denied(fmt.Sprintf("missing annotation %s", key))
	//}
	//if anno != "foo" {
	//	return admission.Denied(fmt.Sprintf("annotation %s did not have value %q", key, "foo"))
	//}

	return admission.Allowed("")
}

// podValidator implements admission.DecoderInjector.
// A decoder will be automatically injected.

// InjectDecoder injects the decoder.
func (v *PodValidator) InjectDecoder(d *admission.Decoder) error {
	v.decoder = d
	return nil
}
