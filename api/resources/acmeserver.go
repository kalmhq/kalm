package resources

import (
	"fmt"
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
	ACMEServer      `json:",inline"`
	IPForNameServer string `json:"ipForNameServer"`
	Ready           bool   `json:"ready"`
}

func (builder *Builder) CreateACMEServer(server ACMEServer) (ACMEServer, error) {
	resource := v1alpha1.ACMEServer{
		ObjectMeta: controllerruntime.ObjectMeta{
			Name: controllers.ACMEServerName,
		},
		Spec: v1alpha1.ACMEServerSpec{
			ACMEDomain: server.ACMEDomain,
			NSDomain:   server.NSDomain,
		},
	}

	err := builder.Create(&resource)

	return ACMEServer{
		Name:       resource.Name,
		ACMEDomain: resource.Spec.ACMEDomain,
		NSDomain:   resource.Spec.NSDomain,
	}, err
}

func (builder *Builder) UpdateACMEServer(server ACMEServer) (ACMEServer, error) {
	expectedACMEServer := v1alpha1.ACMEServer{
		ObjectMeta: controllerruntime.ObjectMeta{
			Name: controllers.ACMEServerName,
		},
		Spec: v1alpha1.ACMEServerSpec{
			ACMEDomain: server.ACMEDomain,
			NSDomain:   server.NSDomain,
		},
	}

	acmeServer, err := builder.GetACMEServer()
	if err != nil {
		return ACMEServer{}, err
	}

	if acmeServer.Name != controllers.ACMEServerName {
		return ACMEServer{}, fmt.Errorf("should only 1 acmeServer named as %s exist", controllers.ACMEServerName)
	}

	acmeServer.Spec = expectedACMEServer.Spec
	err = builder.Update(&acmeServer)

	return ACMEServer{
		Name:       acmeServer.Name,
		ACMEDomain: acmeServer.Spec.ACMEDomain,
		NSDomain:   acmeServer.Spec.NSDomain,
	}, err
}

func (builder *Builder) GetACMEServer() (v1alpha1.ACMEServer, error) {
	var acmeServerList v1alpha1.ACMEServerList
	err := builder.List(&acmeServerList)
	if err != nil {
		return v1alpha1.ACMEServer{}, err
	}

	size := len(acmeServerList.Items)
	if size == 0 {
		return v1alpha1.ACMEServer{}, err
	}

	for _, acmeServer := range acmeServerList.Items {
		if acmeServer.Name != controllers.ACMEServerName {
			continue
		}

		return acmeServer, nil
	}

	return v1alpha1.ACMEServer{}, fmt.Errorf("expected acme-server not exist yet")
}

func (builder *Builder) GetACMEServerAsResp() (ACMEServerResp, error) {
	server, err := builder.GetACMEServer()
	if err != nil {
		return ACMEServerResp{}, err
	}

	return ACMEServerResp{
		ACMEServer: ACMEServer{
			Name:       server.Name,
			ACMEDomain: server.Spec.ACMEDomain,
			NSDomain:   server.Spec.NSDomain,
		},
		IPForNameServer: server.Status.IPForNameServer,
		Ready:           server.Status.Ready,
	}, nil
}

func (builder *Builder) DeleteACMEServer() error {
	return builder.Delete(&v1alpha1.ACMEServer{
		ObjectMeta: metaV1.ObjectMeta{
			Name: controllers.ACMEServerName,
		},
	})
}
