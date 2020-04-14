package resources

import (
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/client-go/kubernetes"
)

type Node struct {
	Name    string            `json:"name"`
	Labels  map[string]string `json:"labels"`
	Status  coreV1.NodeStatus `json:"status"`
	Metrics MetricHistories   `json:"metrics"`
}

type NodesResponse struct {
	Nodes   []Node          `json:"nodes"`
	Metrics MetricHistories `json:"metrics"`
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

	for _, item := range list.Items {
		res.Nodes = append(res.Nodes, Node{
			Name:    item.Name,
			Labels:  item.Labels,
			Status:  item.Status,
			Metrics: histories.Nodes[item.Name],
		})
	}

	return res, nil
}
