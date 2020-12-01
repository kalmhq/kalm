package builtin

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"k8s.io/api/admission/v1beta1"
	corev1 "k8s.io/api/core/v1"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/tools/record"
	"sigs.k8s.io/controller-runtime/pkg/client"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/runtime/inject"
	"sigs.k8s.io/controller-runtime/pkg/webhook/admission"
)

var podAdmissionHandlerLog = logf.Log.WithName("pod-admission-handler")

// +kubebuilder:webhook:path=/admission-handler-v1-pod,mutating=false,failurePolicy=fail,groups="",resources=pods,verbs=create;update;delete,versions=v1,name=vpod.kb.io

// PodAdmissionHandler validates Pods
type PodAdmissionHandler struct {
	client   client.Client
	decoder  *admission.Decoder
	Recorder record.EventRecorder
}

var _ admission.Handler = &PodAdmissionHandler{}

var _ admission.DecoderInjector = &PodAdmissionHandler{}
var _ inject.Client = &PodAdmissionHandler{}

func (v *PodAdmissionHandler) Handle(ctx context.Context, req admission.Request) admission.Response {

	logger := podAdmissionHandlerLog.WithValues("UID", req.UID)
	logger.Info("pod admissionHandler called", "op", req.Operation)

	switch req.Operation {
	case v1beta1.Create:
		return v.HandleCreate(ctx, req)
	case v1beta1.Delete:
		return v.HandleDelete(ctx, req)
	default:
		logger.Info("req ignored,", "req", req.Operation)
		return admission.Allowed("")
	}

}

func (v *PodAdmissionHandler) tryLabelComponentAsExceedingQuota(ns string, component v1alpha1.Component) error {
	if ns == "" {
		return fmt.Errorf("namespace is empty")
	}

	copy := component.DeepCopy()
	copy.Labels[v1alpha1.KalmLabelKeyExceedingQuota] = "true"

	if err := v.client.Update(context.Background(), copy); err != nil {
		podAdmissionHandlerLog.Error(err, "fail to mark component as exceeding limit, ignored", "ns/name", fmt.Sprintf("%s/%s", component.Namespace, component.Name))
		return err
	}

	return nil
}

// InjectDecoder injects the decoder.
func (v *PodAdmissionHandler) InjectDecoder(d *admission.Decoder) error {
	v.decoder = d
	return nil
}

func (v *PodAdmissionHandler) InjectClient(c client.Client) error {
	v.client = c
	return nil
}

func (v *PodAdmissionHandler) HandleCreate(ctx context.Context, req admission.Request) admission.Response {
	logger := podAdmissionHandlerLog.WithValues("UID", req.UID, "ns/name", fmt.Sprintf("%s/%s", req.Namespace, req.Name))
	logger.Info("pod admissionHandler called", "op", req.Operation)

	pod := corev1.Pod{}
	if err := v.decoder.Decode(req, &pod); err != nil {
		return admission.Errored(http.StatusBadRequest, err)
	}

	if v1alpha1.IsKalmSystemNamespace(pod.Namespace) {
		return admission.Allowed("")
	}

	var ns v1.Namespace
	if err := v.client.Get(context.Background(), client.ObjectKey{Name: pod.Namespace}, &ns); err != nil {
		return admission.Errored(http.StatusBadRequest, err)
	}

	if !v1alpha1.IsNamespaceKalmEnabled(ns) {
		return admission.Allowed("")
	}

	var tenantName string
	if tenantName = pod.Labels[v1alpha1.TenantNameLabelKey]; tenantName == "" {
		return admission.Errored(http.StatusBadRequest, v1alpha1.NoTenantFoundError)
	}

	var podList corev1.PodList
	if err := v.client.List(ctx, &podList, client.MatchingLabels{v1alpha1.TenantNameLabelKey: tenantName}); err != nil {
		return admission.Errored(http.StatusBadRequest, err)
	}

	reqInfo := v1alpha1.NewAdmissionRequestInfo(&pod, req.Operation, req.DryRun != nil && *req.DryRun)

	if err := v1alpha1.CheckAndUpdateTenant(tenantName, reqInfo, 3); err != nil {
		logger.Error(err, "fail to allocate res for tenant, CREATE", "tenant", tenantName)

		if err == v1alpha1.ExceedingQuotaError ||
			strings.Contains(err.Error(), v1alpha1.ExceedingQuotaError.Error()) {

			logger.Info("try label component for err", "err", err)

			ns := pod.Namespace
			componentName := pod.Labels[v1alpha1.KalmLabelComponentKey]

			var component v1alpha1.Component
			if err := v.client.Get(context.Background(), client.ObjectKey{Namespace: ns, Name: componentName}, &component); err != nil {
				logger.Error(err, "fail to find component for this pod", "component", componentName)
				return admission.Errored(http.StatusBadRequest, err)
			}

			// fire a warning event
			msg := fmt.Sprintf("fail when trying to allocate resource for pod of component, err: %s", err)
			v.emitWarningEvent(&component, v1alpha1.ReasonExceedingQuota, msg)

			if err := v.tryLabelComponentAsExceedingQuota(ns, component); err != nil {
				logger.Error(err, "fail to mark component as exceeding quota, ignored", "component", componentName)
			}
		}

		return admission.Errored(http.StatusBadRequest, err)
	} else {
		logger.Info("pod resource updated for create", "tenant", tenantName)
	}

	return admission.Allowed("")
}

func (v *PodAdmissionHandler) emitWarningEvent(obj runtime.Object, reason, msg string) {
	v.Recorder.Event(obj, v1.EventTypeWarning, reason, msg)
}

func (v *PodAdmissionHandler) HandleDelete(ctx context.Context, req admission.Request) admission.Response {
	logger := podAdmissionHandlerLog.WithValues("UID", req.UID)
	logger.Info("pod admissionHandler called", "op", req.Operation)

	pod := corev1.Pod{}
	if err := v.decoder.DecodeRaw(req.OldObject, &pod); err != nil {
		return admission.Errored(http.StatusBadRequest, err)
	}

	if v1alpha1.IsKalmSystemNamespace(pod.Namespace) {
		return admission.Allowed("")
	}

	var ns v1.Namespace
	if err := v.client.Get(context.Background(), client.ObjectKey{Name: pod.Namespace}, &ns); err != nil {
		return admission.Errored(http.StatusBadRequest, err)
	}

	if !v1alpha1.IsNamespaceKalmEnabled(ns) {
		return admission.Allowed("")
	}

	var tenantName string
	if tenantName = pod.Labels[v1alpha1.TenantNameLabelKey]; tenantName == "" {
		logger.Info("fail to find tenant in pod being DELETED, ignored", "tenant", tenantName, "pod", fmt.Sprintf("%s/%s", pod.Namespace, pod.Name))
		return admission.Allowed("")
	}

	reqInfo := v1alpha1.NewAdmissionRequestInfo(&pod, req.Operation, req.DryRun != nil && *req.DryRun)

	if err := v1alpha1.CheckAndUpdateTenant(tenantName, reqInfo, 3); err != nil {
		// should not DENY delete pod
		logger.Info("fail to update res for tenant, DELETE", "tenant", tenantName, "err", err)
	} else {
		logger.Info("pod resource updated for delete", "tenant", tenantName)
	}

	return admission.Allowed("")
}
