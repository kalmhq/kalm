package builtin

import (
	"context"
	"net/http"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"k8s.io/api/admission/v1beta1"
	corev1 "k8s.io/api/core/v1"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	"sigs.k8s.io/controller-runtime/pkg/client"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/runtime/inject"
	"sigs.k8s.io/controller-runtime/pkg/webhook/admission"
)

var podAdmissionHandlerLog = logf.Log.WithName("pod-admission-handler")

// +kubebuilder:webhook:path=/admission-handler-v1-pod,mutating=false,failurePolicy=fail,groups="",resources=pods,verbs=create;update;delete,versions=v1,name=vpod.kb.io

// PodAdmissionHandler validates Pods
type PodAdmissionHandler struct {
	client  client.Client
	decoder *admission.Decoder
}

var _ admission.Handler = &PodAdmissionHandler{}

var _ admission.DecoderInjector = &PodAdmissionHandler{}
var _ inject.Client = &PodAdmissionHandler{}

func (v *PodAdmissionHandler) Handle(ctx context.Context, req admission.Request) admission.Response {

	podAdmissionHandlerLog.Info("pod admissionHandler called")

	pod := corev1.Pod{}

	switch req.Operation {
	case v1beta1.Create:
		if err := v.decoder.Decode(req, &pod); err != nil {
			return admission.Errored(http.StatusBadRequest, err)
		}

		var tenant string
		if tenant = pod.Labels[v1alpha1.TenantNameLabelKey]; tenant == "" {
			return admission.Allowed("")
		}

		var podList corev1.PodList
		if err := v.client.List(ctx, &podList, client.MatchingLabels{v1alpha1.TenantNameLabelKey: tenant}); err != nil {
			return admission.Errored(http.StatusBadRequest, err)
		}

		// exist podList + the pod to be created
		sum := getResouceListSumOfPods(append(podList.Items, pod))

		if err := v1alpha1.SetTenantResourceListByName(tenant, sum); err != nil {
			return admission.Errored(http.StatusBadRequest, err)
		}

		podAdmissionHandlerLog.Info("pod resource updated for create", "tenant", tenant, "newQuantity", sum)
	case v1beta1.Delete:
		if err := v.decoder.DecodeRaw(req.OldObject, &pod); err != nil {
			return admission.Errored(http.StatusBadRequest, err)
		}

		var tenant string
		if tenant = pod.Labels[v1alpha1.TenantNameLabelKey]; tenant == "" {
			return admission.Allowed("")
		}

		var podList corev1.PodList
		if err := v.client.List(ctx, &podList, client.MatchingLabels{v1alpha1.TenantNameLabelKey: tenant}); err != nil {
			return admission.Errored(http.StatusBadRequest, err)
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

			sumExceptPodBeenDeleted = sumOfResouceList(sumExceptPodBeenDeleted, getResourceOfPod(pod))
		}

		if err := v1alpha1.SetTenantResourceListByName(tenant, sumExceptPodBeenDeleted); err != nil {
			return admission.Errored(http.StatusBadRequest, err)
		}

		podAdmissionHandlerLog.Info("pod resource updated for delete", "tenant", tenant, "newQuantity", sumExceptPodBeenDeleted)
	default:
		podAdmissionHandlerLog.Info("req ignored,", "req", req.Operation)
	}

	return admission.Allowed("")
}

func getResouceListSumOfPods(pods []corev1.Pod) v1alpha1.ResourceList {
	rstResList := make(map[v1alpha1.ResourceName]resource.Quantity)

	for _, pod := range pods {
		tmp := getResourceOfPod(pod)
		rstResList = sumOfResouceList(rstResList, tmp)
	}

	return rstResList
}

func sumOfResouceList(resourceLists ...v1alpha1.ResourceList) v1alpha1.ResourceList {
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
