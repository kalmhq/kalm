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
	resource := v1alpha1.ACMEServer{
		ObjectMeta: controllerruntime.ObjectMeta{
			Name: controllers.ACMEServerName,
		},
		Spec: v1alpha1.ACMEServerSpec{
			ACMEDomain: server.ACMEDomain,
			NSDomain:   server.NSDomain,
		},
	}

	acmeServerResp, err := builder.GetACMEServer()
	if err != nil {
		return ACMEServer{}, err
	}

	if acmeServerResp.Name == "" {
		return ACMEServer{}, fmt.Errorf("no acme-server to update")
	}

	err = builder.Update(&resource)

	return ACMEServer{
		Name:       resource.Name,
		ACMEDomain: resource.Spec.ACMEDomain,
		NSDomain:   resource.Spec.NSDomain,
	}, err
}

func (builder *Builder) GetACMEServer() (ACMEServerResp, error) {
	var acmeServerList v1alpha1.ACMEServerList
	err := builder.List(&acmeServerList)
	if err != nil {
		return ACMEServerResp{}, err
	}

	size := len(acmeServerList.Items)
	if size == 0 {
		return ACMEServerResp{}, nil
	}

	server := acmeServerList.Items[0]

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
