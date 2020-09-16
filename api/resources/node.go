package resources

import (
	"strings"
	"time"

	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/fields"
	"k8s.io/apimachinery/pkg/util/sets"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type PodRequests struct {
	Namespace string              `json:"namespace"`
	PodName   string              `json:"podName"`
	Requests  coreV1.ResourceList `json:"requests"`
}

type AllocatedResources struct {
	PodsCount    int                 `json:"podsCount"`
	PodsRequests []PodRequests       `json:"podsRequests"`
	Requests     coreV1.ResourceList `json:"requests"`
	Limits       coreV1.ResourceList `json:"limits"`
}

type Node struct {
	Name               string             `json:"name"`
	CreationTimestamp  int64              `json:"creationTimestamp"`
	Labels             map[string]string  `json:"labels"`
	Annotations        map[string]string  `json:"annotations"`
	Status             coreV1.NodeStatus  `json:"status"`
	StatusTexts        []string           `json:"statusTexts"`
	Metrics            MetricHistories    `json:"metrics"`
	Roles              []string           `json:"roles"`
	InternalIP         string             `json:"internalIP"`
	ExternalIP         string             `json:"externalIP"`
	AllocatedResources AllocatedResources `json:"allocatedResources"`
}

type NodesResponse struct {
	Nodes   []Node          `json:"nodes"`
	Metrics MetricHistories `json:"metrics"`
}

const labelNodeRolePrefix = "node-role.kubernetes.io/"
const nodeLabelRole = "kubernetes.io/role"

//https://github.com/kubernetes/kubernetes/blob/master/pkg/printers/internalversion/printers.go
func findNodeRoles(node *coreV1.Node) []string {
	roles := sets.NewString()
	for k, v := range node.Labels {
		switch {
		case strings.HasPrefix(k, labelNodeRolePrefix):
			if role := strings.TrimPrefix(k, labelNodeRolePrefix); len(role) > 0 {
				roles.Insert(role)
			}

		case k == nodeLabelRole && v != "":
			roles.Insert(v)
		}
	}
	return roles.List()
}

func getNodeRunningStatus(node *coreV1.Node) []string {
	conditionMap := make(map[coreV1.NodeConditionType]*coreV1.NodeCondition)
	NodeAllConditions := []coreV1.NodeConditionType{coreV1.NodeReady}
	for i := range node.Status.Conditions {
		cond := node.Status.Conditions[i]
		conditionMap[cond.Type] = &cond
	}
	var status []string
	for _, validCondition := range NodeAllConditions {
		if condition, ok := conditionMap[validCondition]; ok {
			if condition.Status == coreV1.ConditionTrue {
				status = append(status, string(condition.Type))
			} else {
				status = append(status, "Not"+string(condition.Type))
			}
		}
	}

	if len(status) == 0 {
		status = append(status, "Unknown")
	}

	if node.Spec.Unschedulable {
		status = append(status, "SchedulingDisabled")
	}

	return status
}
func getNodeExternalIP(node *coreV1.Node) string {
	for _, address := range node.Status.Addresses {
		if address.Type == coreV1.NodeExternalIP {
			return address.Address
		}
	}

	return "<none>"
}

func getNodeInternalIP(node *coreV1.Node) string {
	for _, address := range node.Status.Addresses {
		if address.Type == coreV1.NodeInternalIP {
			return address.Address
		}
	}

	return "<none>"
}

func (resourceManager *ResourceManager) GetNode(name string) (*coreV1.Node, error) {
	var node coreV1.Node

	if err := resourceManager.Get("", name, &node); err != nil {
		return nil, err
	}

	return &node, nil
}

func (resourceManager *ResourceManager) CordonNode(node *coreV1.Node) error {
	nodeCopy := node.DeepCopy()
	nodeCopy.Spec.Unschedulable = true

	if err := resourceManager.Patch(nodeCopy, client.MergeFrom(node)); err != nil {
		return err
	}
	return nil
}

func (resourceManager *ResourceManager) UncordonNode(node *coreV1.Node) error {
	nodeCopy := node.DeepCopy()
	nodeCopy.Spec.Unschedulable = false

	if err := resourceManager.Patch(nodeCopy, client.MergeFrom(node)); err != nil {
		return err
	}

	return nil
}

func (resourceManager *ResourceManager) BuildNodeResponse(node *coreV1.Node) *Node {
	histories := GetFilteredNodeMetrics([]string{node.Name})

	return &Node{
		Name:               node.Name,
		Labels:             node.Labels,
		Annotations:        node.Annotations,
		Status:             node.Status,
		Metrics:            histories.Nodes[node.Name],
		Roles:              findNodeRoles(node),
		CreationTimestamp:  node.CreationTimestamp.UnixNano() / int64(time.Millisecond),
		StatusTexts:        getNodeRunningStatus(node),
		InternalIP:         getNodeInternalIP(node),
		ExternalIP:         getNodeExternalIP(node),
		AllocatedResources: *resourceManager.getAllocatedResources(node),
	}
}

func (resourceManager *ResourceManager) ListNodes() (*NodesResponse, error) {
	nodeList := &coreV1.NodeList{}
	err := resourceManager.List(nodeList)

	if err != nil {
		return nil, err
	}

	var nodeNames []string
	for _, n := range nodeList.Items {
		nodeNames = append(nodeNames, n.Name)
	}

	histories := GetFilteredNodeMetrics(nodeNames)

	res := &NodesResponse{
		Nodes: make([]Node, 0, len(nodeList.Items)),
		Metrics: MetricHistories{
			CPU:    histories.CPU,
			Memory: histories.Memory,
		},
	}

	for i := range nodeList.Items {
		node := nodeList.Items[i]
		res.Nodes = append(res.Nodes, *resourceManager.BuildNodeResponse(&node))
	}

	return res, nil
}

func (resourceManager *ResourceManager) getAllocatedResources(node *coreV1.Node) *AllocatedResources {
	fieldSelector, err := fields.ParseSelector("spec.nodeName=" + node.Name + ",status.phase!=" + string(coreV1.PodSucceeded) + ",status.phase!=" + string(coreV1.PodFailed))

	nodeNonTerminatedPodsList := &coreV1.PodList{}
	err = resourceManager.List(nodeNonTerminatedPodsList, client.MatchingFieldsSelector{Selector: fieldSelector})

	if err != nil {
		return &AllocatedResources{}
	}

	reqs, limits, err := getPodsTotalRequestsAndLimits(nodeNonTerminatedPodsList)
	if err != nil {
		return &AllocatedResources{}
	}

	podsRequests, err := getPodsRequests(nodeNonTerminatedPodsList)
	if err != nil {
		return &AllocatedResources{}
	}

	return &AllocatedResources{
		PodsCount:    len(nodeNonTerminatedPodsList.Items),
		Requests:     reqs,
		Limits:       limits,
		PodsRequests: podsRequests,
	}
}

func getPodsRequests(podList *coreV1.PodList) (podsRequests []PodRequests, err error) {
	podsRequests = []PodRequests{}
	for _, pod := range podList.Items {
		podReqs, _ := PodRequestsAndLimits(&pod)
		if err != nil {
			return nil, err
		}
		podName := pod.Name
		namespace := pod.Namespace
		podsRequests = append(podsRequests, PodRequests{
			PodName:   podName,
			Namespace: namespace,
			Requests:  podReqs,
		})
	}
	return
}

func getPodsTotalRequestsAndLimits(podList *coreV1.PodList) (reqs coreV1.ResourceList, limits coreV1.ResourceList, err error) {
	reqs, limits = coreV1.ResourceList{}, coreV1.ResourceList{}
	for _, pod := range podList.Items {
		podReqs, podLimits := PodRequestsAndLimits(&pod)
		if err != nil {
			return nil, nil, err
		}
		for podReqName, podReqValue := range podReqs {
			if value, ok := reqs[podReqName]; !ok {
				reqs[podReqName] = podReqValue
			} else {
				value.Add(podReqValue)
				reqs[podReqName] = value
			}
		}
		for podLimitName, podLimitValue := range podLimits {
			if value, ok := limits[podLimitName]; !ok {
				limits[podLimitName] = podLimitValue
			} else {
				value.Add(podLimitValue)
				limits[podLimitName] = value
			}
		}
	}
	return
}

func PodRequestsAndLimits(pod *coreV1.Pod) (reqs, limits coreV1.ResourceList) {
	reqs, limits = coreV1.ResourceList{}, coreV1.ResourceList{}
	for _, container := range pod.Spec.Containers {
		addResourceList(reqs, container.Resources.Requests)
		addResourceList(limits, container.Resources.Limits)
	}
	// init containers define the minimum of any resource
	for _, container := range pod.Spec.InitContainers {
		maxResourceList(reqs, container.Resources.Requests)
		maxResourceList(limits, container.Resources.Limits)
	}

	// Add overhead for running a pod to the sum of requests and to non-zero limits:
	if pod.Spec.Overhead != nil {
		addResourceList(reqs, pod.Spec.Overhead)

		for name, quantity := range pod.Spec.Overhead {
			if value, ok := limits[name]; ok && !value.IsZero() {
				value.Add(quantity)
				limits[name] = value
			}
		}
	}
	return
}

// addResourceList adds the resources in newList to list
func addResourceList(list, new coreV1.ResourceList) {
	for name, quantity := range new {
		if value, ok := list[name]; !ok {
			list[name] = quantity.DeepCopy()
		} else {
			value.Add(quantity)
			list[name] = value
		}
	}
}

// maxResourceList sets list to the greater of list/newList for every resource
// either list
func maxResourceList(list, new coreV1.ResourceList) {
	for name, quantity := range new {
		if value, ok := list[name]; !ok {
			list[name] = quantity.DeepCopy()
			continue
		} else {
			if quantity.Cmp(value) > 0 {
				list[name] = quantity.DeepCopy()
			}
		}
	}
}
