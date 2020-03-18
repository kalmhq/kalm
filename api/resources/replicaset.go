package resources

import (
	appsV1 "k8s.io/api/apps/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type ReplicaSetListChannel struct {
	List  chan *appsV1.ReplicaSetList
	Error chan error
}

func (builder *Builder) GetReplicaSetListChannel(namespaces string, listOptions metaV1.ListOptions) *ReplicaSetListChannel {
	channel := &ReplicaSetListChannel{
		List:  make(chan *appsV1.ReplicaSetList, 1),
		Error: make(chan error, 1),
	}

	go func() {
		list, err := builder.K8sClient.AppsV1().ReplicaSets(namespaces).
			List(listOptions)
		channel.List <- list
		channel.Error <- err
	}()

	return channel
}
