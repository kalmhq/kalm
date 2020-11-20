package v1alpha1

import (
	"context"
	"fmt"

	logf "sigs.k8s.io/controller-runtime/pkg/log"

	admissionv1beta1 "k8s.io/api/admission/v1beta1"
	corev1 "k8s.io/api/core/v1"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

var podEvaluatorLog = logf.Log.WithName("pod-admission-handler")

type podEvaluator struct {
}

var _ TenantEvaluator = &podEvaluator{}

func (e podEvaluator) Usage(reqInfo AdmissionRequestInfo) (ResourceList, error) {

	tenantName, err := GetTenantNameFromObj(reqInfo.Obj)
	if err != nil {
		return nil, err
	} else if tenantName == "" {
		return nil, NoTenantFoundError
	}

	pod, ok := reqInfo.Obj.(*corev1.Pod)
	if !ok {
		return nil, fmt.Errorf("reqInfo.obj is not pod")
	}

	var podList corev1.PodList
	if err := webhookClient.List(context.Background(), &podList, client.MatchingLabels{TenantNameLabelKey: tenantName}); err != nil {
		return nil, err
	}

	podsToSum := getPodsToSum(*pod, podList.Items, reqInfo.Operation)

	sum := getResourceListSumOfPods(podsToSum)

	return sum, nil
}

func getPodsToSum(curPod corev1.Pod, podList []corev1.Pod, op admissionv1beta1.Operation) []corev1.Pod {

	var rst []corev1.Pod

	// rm duplicate if exist using map
	podMap := make(map[string]corev1.Pod)

	curPodKey := getKey(&curPod)
	podMap[curPodKey] = curPod

	for _, pod := range podList {
		podMap[getKey(&pod)] = pod
	}

	isDeleteOp := op == admissionv1beta1.Delete

	// find pods to sum
	for key, pod := range podMap {
		if pod.DeletionTimestamp != nil {
			continue
		}

		if isDeleteOp && key == curPodKey {
			continue
		}

		rst = append(rst, pod)
	}

	return rst
}

func getResourceListSumOfPods(pods []corev1.Pod) ResourceList {
	rstResList := ResourceList{
		ResourceCPU:    resource.MustParse("0"),
		ResourceMemory: resource.MustParse("0"),
	}

	podMap := make(map[string]bool)

	for _, pod := range pods {
		podKey := fmt.Sprintf("%s/%s", pod.Namespace, pod.Name)

		if _, exist := podMap[podKey]; exist {
			continue
		} else {
			podMap[podKey] = true
		}

		resOfPod := getResourceOfPod(pod)
		rstResList = sumOfResourceList(rstResList, resOfPod)
	}

	return rstResList
}

func sumOfResourceList(resourceLists ...ResourceList) ResourceList {
	rstResList := make(map[ResourceName]resource.Quantity)

	for _, resourceList := range resourceLists {
		for resName, quantity := range resourceList {
			inc(rstResList, resName, quantity)
		}
	}

	return rstResList
}

// currently only cpu & mem
// todo, consider initContainer, ephemeralStorage
// return peek resource consumption
func getResourceOfPod(pod corev1.Pod) ResourceList {

	rstResList := ResourceList{
		ResourceCPU:    resource.MustParse("0"),
		ResourceMemory: resource.MustParse("0"),
	}

	for _, container := range pod.Spec.Containers {
		for resName, quantity := range container.Resources.Limits {
			switch resName {
			case v1.ResourceCPU:
				inc(rstResList, ResourceCPU, quantity)
			case v1.ResourceMemory:
				inc(rstResList, ResourceMemory, quantity)
			default:
				podEvaluatorLog.Info("resource limit ignored,", "resourceName", resName)
			}
		}

		for _, vol := range pod.Spec.Volumes {
			podEvaluatorLog.Info("vol info", "vol", vol)

			if vol.EmptyDir != nil {
				switch vol.EmptyDir.Medium {
				case corev1.StorageMediumMemory:
					// todo pod volume: istio-envoy comes without limit
					if vol.EmptyDir.SizeLimit != nil {
						inc(rstResList, ResourceMemory, *vol.EmptyDir.SizeLimit)
					}
				case corev1.StorageMediumDefault:
					// todo create dir on host, maybe we should disable this for saas version
					podEvaluatorLog.Info("emptyDir using defaultMedium ignored", "medium", vol.EmptyDir.Medium)
				default:
					podEvaluatorLog.Info("emptyDir ignored", "medium", vol.EmptyDir.Medium)
				}
			}
		}
	}

	return rstResList
}

func inc(resList map[ResourceName]resource.Quantity, resName ResourceName, delta resource.Quantity) {
	if v, exist := resList[resName]; exist {
		v.Add(delta)
		resList[resName] = v
	} else {
		resList[resName] = delta
	}
}
