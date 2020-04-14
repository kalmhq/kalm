package resources

import (
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/client-go/kubernetes"
)

type Node struct {
	Name string `json:"name"`
	Labels map[string]string `json:"labels"`
	Status coreV1.NodeStatus `json:"status"`
}

func ListNodes(k8sClient *kubernetes.Clientset) ([]Node, error) {
	list, err := k8sClient.CoreV1().Nodes().List(ListAll)

	if err != nil {
		return nil, err
	}

	res := make([]Node, 0, len(list.Items))

	for _, item := range list.Items {
		res = append(res, Node{
			Name: item.Name,
			Labels: item.Labels,
			Status: item.Status,
		})
	}

	return res, nil
}