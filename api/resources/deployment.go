package resources

import (
	appsV1 "k8s.io/api/apps/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type DeploymentListChannel struct {
	List  chan *appsV1.DeploymentList
	Error chan error
}

func (builder *Builder) GetDeploymentListChannel(namespaces string, listOptions metaV1.ListOptions) *DeploymentListChannel {
	channel := &DeploymentListChannel{
		List:  make(chan *appsV1.DeploymentList, 1),
		Error: make(chan error, 1),
	}

	go func() {
		list, err := builder.K8sClient.AppsV1().Deployments(namespaces).
			List(listOptions)

		channel.List <- list
		channel.Error <- err
	}()

	return channel
}
