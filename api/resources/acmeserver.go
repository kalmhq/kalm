package resources

import (
	"fmt"
	"github.com/kalmhq/kalm/api/errors"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/kalmhq/kalm/controller/controllers"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	controllerruntime "sigs.k8s.io/controller-runtime"
)

type ACMEServer struct {
	Name       string `json:"name"`
	ACMEDomain string `json:"acmeDomain"`
	NSDomain   string `json:"nsDomain"`
}

type ACMEServerResp struct {
	*ACMEServer     `json:",inline"`
	IPForNameServer string `json:"ipForNameServer"`
	Ready           bool   `json:"ready"`
}

func (resourceManager *ResourceManager) CreateACMEServer(server *ACMEServer) (*ACMEServer, error) {
	resource := &v1alpha1.ACMEServer{
		ObjectMeta: controllerruntime.ObjectMeta{
			Name: controllers.ACMEServerName,
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
	expectedACMEServer := v1alpha1.ACMEServer{
		ObjectMeta: controllerruntime.ObjectMeta{
			Name: controllers.ACMEServerName,
		},
		Spec: v1alpha1.ACMEServerSpec{
			ACMEDomain: server.ACMEDomain,
			NSDomain:   server.NSDomain,
		},
	}

	acmeServer, err := resourceManager.GetACMEServer()

	if err != nil {
		return nil, err
	}

	if acmeServer.Name != controllers.ACMEServerName {
		return nil, fmt.Errorf("should only 1 acmeServer named as %s exist", controllers.ACMEServerName)
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
		return nil, errors.NewNotFound("")
	}

	for i := range acmeServerList.Items {
		acmeServer := &acmeServerList.Items[i]

		if acmeServer.Name != controllers.ACMEServerName {
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
		IPForNameServer: server.Status.IPForNameServer,
		Ready:           server.Status.Ready,
	}
}

func (resourceManager *ResourceManager) GetACMEServerAsResp() (*ACMEServerResp, error) {
	server, err := resourceManager.GetACMEServer()

	if err != nil {
		return nil, err
	}

	return &ACMEServerResp{
		ACMEServer: &ACMEServer{
			Name:       server.Name,
			ACMEDomain: server.Spec.ACMEDomain,
			NSDomain:   server.Spec.NSDomain,
		},
		IPForNameServer: server.Status.IPForNameServer,
		Ready:           server.Status.Ready,
	}, nil
}

func (resourceManager *ResourceManager) DeleteACMEServer() error {
	return resourceManager.Delete(&v1alpha1.ACMEServer{
		ObjectMeta: metaV1.ObjectMeta{
			Name: controllers.ACMEServerName,
		},
	})
}
