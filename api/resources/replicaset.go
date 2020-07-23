package resources

import (
	appsV1 "k8s.io/api/apps/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type ReplicaSetListChannel struct {
	List  chan *appsV1.ReplicaSetList
	Error chan error
}

func (builder *Builder) GetReplicaSetListChannel(namespaces string) *ReplicaSetListChannel {
	channel := &ReplicaSetListChannel{
		List:  make(chan *appsV1.ReplicaSetList, 1),
		Error: make(chan error, 1),
	}

	go func() {
		list := &appsV1.ReplicaSetList{}
		err := builder.List(list, client.InNamespace(namespaces))
		channel.List <- list
		channel.Error <- err
	}()

	return channel
}
