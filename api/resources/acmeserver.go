package resources

import (
	"fmt"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	controllerruntime "sigs.k8s.io/controller-runtime"
)

type ACMEServer struct {
	Name       string `json:"name"`
	ACMEDomain string `json:"acmeDomain"`
	NSDomain   string `json:"nsDomain"`
}

type ACMEServerResp struct {
	*ACMEServer           `json:",inline"`
	IPForNameServer       string `json:"ipForNameServer"`
	HostnameForNameServer string `json:"hostnameForNameServer"`
	Ready                 bool   `json:"ready"`
}

func (resourceManager *ResourceManager) CreateACMEServer(server *ACMEServer) (*ACMEServer, error) {
	resource := &v1alpha1.ACMEServer{
		ObjectMeta: controllerruntime.ObjectMeta{
			Name: v1alpha1.ACMEServerName,
		},
		Spec: v1alpha1.ACMEServerSpec{
			ACMEDomain: server.ACMEDomain,
			NSDomain:   server.NSDomain,
		},
	}

	err := resourceManager.Create(resource)

	return &ACMEServer{
		Name:       resource.Name,
		ACMEDomain: resource.Spec.ACMEDomain,
		NSDomain:   resource.Spec.NSDomain,
	}, err
}

func (resourceManager *ResourceManager) UpdateACMEServer(server *ACMEServer) (*ACMEServer, error) {
	acmeServer, err := resourceManager.GetACMEServer()

	if err != nil {
		if errors.IsNotFound(err) {
			return resourceManager.CreateACMEServer(server)
		}

		return nil, err
	}

	expectedACMEServer := v1alpha1.ACMEServer{
		ObjectMeta: controllerruntime.ObjectMeta{
			Name: v1alpha1.ACMEServerName,
		},
		Spec: v1alpha1.ACMEServerSpec{
			ACMEDomain: server.ACMEDomain,
			NSDomain:   server.NSDomain,
		},
	}

	if acmeServer == nil {
		return resourceManager.CreateACMEServer(server)
	}

	acmeServer.Spec = expectedACMEServer.Spec

	err = resourceManager.Update(acmeServer)

	return &ACMEServer{
		Name:       acmeServer.Name,
		ACMEDomain: acmeServer.Spec.ACMEDomain,
		NSDomain:   acmeServer.Spec.NSDomain,
	}, err
}

func (resourceManager *ResourceManager) GetACMEServer() (*v1alpha1.ACMEServer, error) {
	var acmeServerList v1alpha1.ACMEServerList

	if err := resourceManager.List(&acmeServerList); err != nil {
		return nil, err
	}

	if size := len(acmeServerList.Items); size == 0 {
		return nil, nil
	}

	for i := range acmeServerList.Items {
		acmeServer := &acmeServerList.Items[i]

		if acmeServer.Name != v1alpha1.ACMEServerName {
			continue
		}

		return acmeServer, nil
	}

	return nil, fmt.Errorf("expected acme-server not exist yet")
}

func BuildACMEServerResponse(server *v1alpha1.ACMEServer) *ACMEServerResp {
	return &ACMEServerResp{
		ACMEServer: &ACMEServer{
			Name:       server.Name,
			ACMEDomain: server.Spec.ACMEDomain,
			NSDomain:   server.Spec.NSDomain,
		},
		IPForNameServer:       server.Status.NameServerIP,
		HostnameForNameServer: server.Status.NameServerHostname,
		Ready:                 server.Status.Ready,
	}
}

func (resourceManager *ResourceManager) GetACMEServerAsResp() (*ACMEServerResp, error) {
	server, err := resourceManager.GetACMEServer()

	if err != nil {
		return nil, err
	}

	if server == nil {
		return nil, nil
	}

	return BuildACMEServerResponse(server), nil
}

func (resourceManager *ResourceManager) DeleteACMEServer() error {
	return resourceManager.Delete(&v1alpha1.ACMEServer{
		ObjectMeta: metav1.ObjectMeta{
			Name: v1alpha1.ACMEServerName,
		},
	})
}
