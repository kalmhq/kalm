package builtin

import (
	"context"
	"fmt"
	"net/http"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"k8s.io/api/admission/v1beta1"
	corev1 "k8s.io/api/core/v1"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
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

func getResourceListSumOfPods(pods []corev1.Pod) v1alpha1.ResourceList {
	rstResList := make(map[v1alpha1.ResourceName]resource.Quantity)

	podMap := make(map[string]bool)

	for _, pod := range pods {
		podKey := fmt.Sprintf("%s/%s", pod.Namespace, pod.Name)

		if _, exist := podMap[podKey]; exist {
			continue
		} else {
			podMap[podKey] = true
		}

		tmp := getResourceOfPod(pod)
		rstResList = sumOfResourceList(rstResList, tmp)
	}

	return rstResList
}

func sumOfResourceList(resourceLists ...v1alpha1.ResourceList) v1alpha1.ResourceList {
	rstResList := make(map[v1alpha1.ResourceName]resource.Quantity)

	for _, resourceList := range resourceLists {
		for resName, quantity := range resourceList {
			inc(rstResList, resName, quantity)
		}
	}

	return rstResList
}

// currently only cpu & mem
func getResourceOfPod(pod corev1.Pod) v1alpha1.ResourceList {

	rstResList := make(map[v1alpha1.ResourceName]resource.Quantity)

	for _, container := range pod.Spec.Containers {
		for resName, quantity := range container.Resources.Limits {
			switch resName {
			case v1.ResourceCPU:
				inc(rstResList, v1alpha1.ResourceCPU, quantity)
			case v1.ResourceMemory:
				inc(rstResList, v1alpha1.ResourceMemory, quantity)
			default:
				podAdmissionHandlerLog.Info("resource limit ignored,", "resourceName", resName)
			}
		}

		for _, vol := range pod.Spec.Volumes {
			podAdmissionHandlerLog.Info("vol info", "vol", vol)

			if vol.EmptyDir != nil {
				switch vol.EmptyDir.Medium {
				case corev1.StorageMediumMemory:
					// todo pod volume: istio-envoy comes without limit
					if vol.EmptyDir.SizeLimit != nil {
						inc(rstResList, v1alpha1.ResourceMemory, *vol.EmptyDir.SizeLimit)
					}
				case corev1.StorageMediumDefault:
					// todo create dir on host, maybe we should disable this for saas version
					podAdmissionHandlerLog.Info("emptyDir using defaultMedium ignored", "medium", vol.EmptyDir.Medium)
				default:
					podAdmissionHandlerLog.Info("emptyDir ignored", "medium", vol.EmptyDir.Medium)
				}
			}
		}
	}

	return rstResList
}

func inc(resList map[v1alpha1.ResourceName]resource.Quantity, resName v1alpha1.ResourceName, delta resource.Quantity) {
	if v, exist := resList[resName]; exist {
		v.Add(delta)
		resList[resName] = v
	} else {
		resList[resName] = delta
	}
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
	logger := podAdmissionHandlerLog.WithValues("UID", req.UID)
	logger.Info("pod admissionHandler called", "op", req.Operation, "ns/name", fmt.Sprintf("%s/%s", req.Namespace, req.Name))

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

	// exist podList + the pod to be created
	sum := getResourceListSumOfPods(append(podList.Items, pod))

	if err := v1alpha1.SetTenantResourceListByName(tenantName, sum); err != nil {
		logger.Error(err, "fail to allocate res for tenant, CREATE", "tenant", tenantName, "sum", sum)

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

		// codereview from david: @mingmin
		// should we use component status instead of labels?
		if err := v.tryLabelComponentAsExceedingQuota(ns, component); err != nil {
			logger.Error(err, "fail to mark component as exceeding quota, ignored", "component", componentName)
		}

		return admission.Errored(http.StatusBadRequest, err)
	} else {
		logger.Info("pod resource updated for create", "tenant", tenantName, "newQuantity", sum)
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

	var podList corev1.PodList
	if err := v.client.List(ctx, &podList, client.MatchingLabels{v1alpha1.TenantNameLabelKey: tenantName}); err != nil {
		return admission.Errored(http.StatusInternalServerError, err)
	}

	// exist podList - the pod been deleted
	sumExceptPodBeenDeleted := v1alpha1.ResourceList{
		v1alpha1.ResourceCPU:    resource.MustParse("0"),
		v1alpha1.ResourceMemory: resource.MustParse("0"),
	}

	for _, tmpPod := range podList.Items {
		if pod.Namespace == tmpPod.Namespace && pod.Name == tmpPod.Name {
			// ignore pod been deleted
			continue
		}

		// ignore other deleted pods
		if pod.DeletionTimestamp != nil && pod.DeletionTimestamp.Unix() > 0 {
			continue
		}

		sumExceptPodBeenDeleted = sumOfResourceList(sumExceptPodBeenDeleted, getResourceOfPod(pod))
	}

	if err := v1alpha1.SetTenantResourceListByName(tenantName, sumExceptPodBeenDeleted); err != nil {
		// should not DENY delete pod
		logger.Info("fail to update res for tenant, DELETE", "tenant", tenantName, "err", err, "sum", sumExceptPodBeenDeleted)
	} else {
		logger.Info("pod resource updated for delete", "tenant", tenantName, "newQuantity", sumExceptPodBeenDeleted)
	}

	return admission.Allowed("")
}
