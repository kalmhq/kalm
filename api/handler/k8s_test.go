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
	// create pv
	pv := coreV1.PersistentVolume{
		ObjectMeta: v1.ObjectMeta{
			Name: "exist-available-pv",
		},
		Spec: coreV1.PersistentVolumeSpec{
			PersistentVolumeReclaimPolicy: coreV1.PersistentVolumeReclaimRetain,
			Capacity: coreV1.ResourceList(map[coreV1.ResourceName]resource.Quantity{
				coreV1.ResourceStorage: resource.MustParse("1Mi"),
			}),
			AccessModes: []coreV1.PersistentVolumeAccessMode{coreV1.ReadWriteOnce},
			PersistentVolumeSource: coreV1.PersistentVolumeSource{
				HostPath: &coreV1.HostPathVolumeSource{
					Path: "/data",
				},
			},
		},
	}

	suite.Nil(suite.Create(&pv))
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterViewerRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1/persistentvolumes",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsMissingRoleError(rec, "viewer", "cluster")
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var pvList coreV1.PersistentVolumeList
			rec.BodyAsJSON(&pvList)

			suite.NotNil(rec)
			suite.Equal(1, len(pvList.Items))
		},
	})
}

func TestK8sHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(K8sHandlerTestSuite))
}
