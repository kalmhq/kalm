package resources

import (
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	coreV1 "k8s.io/api/core/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"strings"
)

type ServiceListChannel struct {
	List  chan []coreV1.Service
	Error chan error
}

type ServicePort struct {
	AppProtocol v1alpha1.PortProtocol `json:"appProtocol"`
	Protocol    coreV1.Protocol       `json:"protocol"`
	Port        int32                 `json:"port"`
	TargetPort  int32                 `json:"targetPort"`
	NodePort    int32                 `json:"nodePort"`
}

type Service struct {
	Name      string        `json:"name"`
	Namespace string        `json:"namespace"`
	Ports     []ServicePort `json:"ports"`
}

func (builder *Builder) GetServiceListChannel(opts ...client.ListOption) *ServiceListChannel {
	channel := &ServiceListChannel{
		List:  make(chan []coreV1.Service, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var list coreV1.ServiceList
		err := builder.List(&list, opts...)

		if err != nil {
			channel.List <- nil
			channel.Error <- err
			return
		}

		res := make([]coreV1.Service, len(list.Items))

		for i := range list.Items {
			res[i] = list.Items[i]
		}

		channel.List <- res
		channel.Error <- err
	}()

	return channel
}

func BuildServiceResponse(svc *coreV1.Service) *Service {
	ports := make([]ServicePort, len(svc.Spec.Ports))

	for j, port := range svc.Spec.Ports {
		ports[j] = ServicePort{
			AppProtocol: getAppProtocolFromServiceName(port.Name),
			Protocol:    port.Protocol,
			Port:        port.Port,
			TargetPort:  int32(port.TargetPort.IntValue()),
			NodePort:    port.NodePort,
		}
	}

	return &Service{
		Name:      svc.Name,
		Namespace: svc.Namespace,
		Ports:     ports,
	}
}

func (builder *Builder) GetServices(namespace string) ([]*Service, error) {
	var services coreV1.ServiceList

	if err := builder.List(&services, client.InNamespace(namespace)); err != nil {
		return nil, err
	}

	res := make([]*Service, len(services.Items))

	for i := range services.Items {
		res[i] = BuildServiceResponse(&services.Items[i])
	}

	return res, nil
}

func getAppProtocolFromServiceName(name string) v1alpha1.PortProtocol {

	if strings.HasPrefix(name, string(v1alpha1.PortProtocolGRPCWEB)) {
		return v1alpha1.PortProtocolGRPCWEB
	}

	parts := strings.Split(name, "-")

	if len(parts) == 0 {
		return v1alpha1.PortProtocolUnknown
	}

	switch parts[0] {
	case string(v1alpha1.PortProtocolHTTP):
		return v1alpha1.PortProtocolHTTP
	case string(v1alpha1.PortProtocolHTTP2):
		return v1alpha1.PortProtocolHTTP2
	case string(v1alpha1.PortProtocolHTTPS):
		return v1alpha1.PortProtocolHTTPS
	case string(v1alpha1.PortProtocolGRPC):
		return v1alpha1.PortProtocolGRPC
	case string(v1alpha1.PortProtocolTCP):
		return v1alpha1.PortProtocolTCP
	case string(v1alpha1.PortProtocolUDP):
		return v1alpha1.PortProtocolUDP
	default:
		return v1alpha1.PortProtocolGRPCWEB
	}
}
