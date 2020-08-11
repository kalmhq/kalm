package handler

import (
	"github.com/stretchr/testify/suite"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
	"testing"
)

type K8sHandlerTestSuite struct {
	WithControllerTestSuite
}

func (suite *K8sHandlerTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()
	suite.ensureNamespaceExist("test-pvc")
}

func (suite *K8sHandlerTestSuite) TestHandleGetPVs() {
	pvNameToReuse := "exist-available-pv"
	hostPath := coreV1.HostPathVolumeSource{
		Path: "/data",
	}
	// prepare pv
	pv := coreV1.PersistentVolume{
		ObjectMeta: v1.ObjectMeta{
			Name: pvNameToReuse,
		},
		Spec: coreV1.PersistentVolumeSpec{
			PersistentVolumeReclaimPolicy: coreV1.PersistentVolumeReclaimRetain,
			Capacity: coreV1.ResourceList(map[coreV1.ResourceName]resource.Quantity{
				coreV1.ResourceStorage: resource.MustParse("1Mi"),
			}),
			AccessModes: []coreV1.PersistentVolumeAccessMode{coreV1.ReadWriteOnce},
			PersistentVolumeSource: coreV1.PersistentVolumeSource{
				HostPath: &hostPath,
			},
		},
	}

	err := suite.Create(&pv)
	suite.Nil(err)

	rec := suite.NewRequest(http.MethodGet, "/v1/persistentvolumes", "{}")
	var pvList coreV1.PersistentVolumeList
	rec.BodyAsJSON(&pvList)

	suite.NotNil(rec)
	suite.Equal(1, len(pvList.Items))

}

func TestK8sHandlerTestSuite (t *testing.T){
	suite.Run(t, new(K8sHandlerTestSuite))
}
