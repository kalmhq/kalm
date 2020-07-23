package resources

import (
	appsV1 "k8s.io/api/apps/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type DeploymentListChannel struct {
	List  chan *appsV1.DeploymentList
	Error chan error
}

func (builder *Builder) GetDeploymentListChannel(namespaces string) *DeploymentListChannel {
	channel := &DeploymentListChannel{
		List:  make(chan *appsV1.DeploymentList, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var deployments appsV1.DeploymentList
		err := builder.List(&deployments, client.InNamespace(namespaces))

		channel.List <- &deployments
		channel.Error <- err
	}()

	return channel
}
