package resources

import (
	"strings"
	"time"

	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/fields"
	"k8s.io/apimachinery/pkg/util/sets"
	"k8s.io/client-go/kubernetes"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type AllocatedResources struct {
	PodsCount int                                       `json:"podsCount"`
	Requests  map[coreV1.ResourceName]resource.Quantity `json:"requests"`
	Limits    map[coreV1.ResourceName]resource.Quantity `json:"limits"`
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

func (builder *Builder) GetNode(name string) (*coreV1.Node, error) {
	var node coreV1.Node

	if err := builder.Get("", name, &node); err != nil {
		return nil, err
	}

	return &node, nil
}

func (builder *Builder) CordonNode(node *coreV1.Node) error {
	nodeCopy := node.DeepCopy()
	nodeCopy.Spec.Unschedulable = true

	if err := builder.Patch(nodeCopy, client.MergeFrom(node)); err != nil {
		return err
	}
	return nil
}

func (builder *Builder) UncordonNode(node *coreV1.Node) error {
	nodeCopy := node.DeepCopy()
	nodeCopy.Spec.Unschedulable = false

	if err := builder.Patch(nodeCopy, client.MergeFrom(node)); err != nil {
		return err
	}

	return nil
}

func BuildNodeResponse(node *coreV1.Node) *Node {
	histories := GetFilteredNodeMetrics([]string{node.Name})

	return &Node{
		Name:              node.Name,
		Labels:            node.Labels,
		Annotations:       node.Annotations,
		Status:            node.Status,
		Metrics:           histories.Nodes[node.Name],
		Roles:             findNodeRoles(node),
		CreationTimestamp: node.CreationTimestamp.UnixNano() / int64(time.Millisecond),
		StatusTexts:       getNodeRunningStatus(node),
		InternalIP:        getNodeInternalIP(node),
		ExternalIP:        getNodeExternalIP(node),
	}
}

func ListNodes(k8sClient *kubernetes.Clientset) (*NodesResponse, error) {
	list, err := k8sClient.CoreV1().Nodes().List(ListAll)

	if err != nil {
		return nil, err
	}

	var nodeNames []string
	for _, n := range list.Items {
		nodeNames = append(nodeNames, n.Name)
	}

	histories := GetFilteredNodeMetrics(nodeNames)

	res := &NodesResponse{
		Nodes: make([]Node, 0, len(list.Items)),
		Metrics: MetricHistories{
			CPU:    histories.CPU,
			Memory: histories.Memory,
		},
	}

	for i := range list.Items {
		node := list.Items[i]
		res.Nodes = append(res.Nodes, *BuildNodeResponse(&node))
	}

	return res, nil
}

func getAllocatedResources(k8sClient *kubernetes.Clientset, node *coreV1.Node) (*AllocatedResources, error) {
	fieldSelector, err := fields.ParseSelector("spec.nodeName=" + node.Name + ",status.phase!=" + string(coreV1.PodSucceeded) + ",status.phase!=" + string(coreV1.PodFailed))

	k8sClient.CoreV1().Nodes().List(ListAll)

	nodeNonTerminatedPodsList, err := k8sClient.CoreV1().Pods("").List(metav1.ListOptions{FieldSelector: fieldSelector.String()})
	if err != nil {
		return nil, err
	}

	reqs, limits, err := getPodsTotalRequestsAndLimits(nodeNonTerminatedPodsList)
	if err != nil {
		return nil, err
	}

	return &AllocatedResources{
		PodsCount: len(nodeNonTerminatedPodsList.Items),
		Requests:  reqs,
		Limits:    limits,
	}, nil
}

func getPodsTotalRequestsAndLimits(podList *coreV1.PodList) (reqs map[coreV1.ResourceName]resource.Quantity, limits map[coreV1.ResourceName]resource.Quantity, err error) {
	reqs, limits = map[coreV1.ResourceName]resource.Quantity{}, map[coreV1.ResourceName]resource.Quantity{}
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
