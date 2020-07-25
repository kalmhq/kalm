package handler

import (
	"encoding/json"
	"fmt"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
	"testing"
)

type ComponentTestSuite struct {
	WithControllerTestSuite
	namespace string
}

func TestComponentTestSuite(t *testing.T) {
	suite.Run(t, new(ComponentTestSuite))
}

func (suite *ComponentTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()
	suite.namespace = "kalm-test"

	suite.ensureNamespaceExist(suite.namespace)

}

func (suite *ComponentTestSuite) TeardownSuite() {
	suite.ensureNamespaceDeleted(suite.namespace)
}

func (suite *ComponentTestSuite) TestGetEmptyComponentList() {
	rec := suite.NewRequest(http.MethodGet, fmt.Sprintf("/v1alpha1/applications/%s/components", suite.namespace), nil)

	var res []resources.Component
	rec.BodyAsJSON(&res)

	suite.Equal(200, rec.Code)
}

func (suite *ComponentTestSuite) TestBasicRequestOfComponents() {
	// Create
	rec := suite.NewRequest(
		http.MethodPost,
		fmt.Sprintf("/v1alpha1/applications/%s/components", suite.namespace),
		resources.Component{
			Name: "foobar",
			ComponentSpec: v1alpha1.ComponentSpec{
				Image: "foo",
			},
		},
	)
	var res resources.Component
	rec.BodyAsJSON(&res)
	suite.Equal(201, rec.Code)
	suite.Equal("foo", res.Image)

	// Get
	rec = suite.NewRequest(http.MethodGet,
		fmt.Sprintf("/v1alpha1/applications/%s/components/%s", suite.namespace, "foobar"),
		nil,
	)
	rec.BodyAsJSON(&res)
	suite.Equal(200, rec.Code)
	suite.Equal("foo", res.Image)

	// Update
	rec = suite.NewRequest(http.MethodPut,
		fmt.Sprintf("/v1alpha1/applications/%s/components/%s", suite.namespace, "foobar"),
		resources.Component{
			Name: "foobar",
			ComponentSpec: v1alpha1.ComponentSpec{
				Image: "foo2",
			},
		},
	)
	rec.BodyAsJSON(&res)
	suite.Equal(200, rec.Code)
	suite.Equal("foo2", res.Image)

	// Delete
	rec = suite.NewRequest(http.MethodDelete,
		fmt.Sprintf("/v1alpha1/applications/%s/components/%s", suite.namespace, "foobar"),
		nil,
	)
	suite.Equal(204, rec.Code)

	// Get
	rec = suite.NewRequest(http.MethodGet,
		fmt.Sprintf("/v1alpha1/applications/%s/components/%s", suite.namespace, "foobar"),
		nil,
	)
	suite.Equal(404, rec.Code)
}

func (suite *ComponentTestSuite) TestCreateComponentWithPVCAsVolume() {

	sc := "kalm-standard"
	reqComp := resources.Component{
		Name: "foobar-create-new-pv",
		ComponentSpec: v1alpha1.ComponentSpec{
			Image: "foo",
			Volumes: []v1alpha1.Volume{
				{
					Path:             "/data",
					Size:             resource.MustParse("1Mi"),
					Type:             v1alpha1.VolumeTypePersistentVolumeClaim,
					StorageClassName: &sc,
				},
			},
		},
	}

	compInJSON, err := json.Marshal(reqComp)
	suite.Nil(err)

	apiURL := fmt.Sprintf("/v1alpha1/applications/%s/components", suite.namespace)

	rec := suite.NewRequest(http.MethodPost, apiURL, string(compInJSON))

	var res resources.Component
	rec.BodyAsJSON(&res)

	suite.Equal(201, rec.Code)

	// check if volume in Comp is as expected
	compList, err := suite.getComponentList(suite.namespace)
	suite.Nil(err)
	suite.Equal(1, len(compList.Items))

	comp := compList.Items[0]
	suite.Equal(1, len(comp.Spec.Volumes))

	expectedPVCName := res.Volumes[0].PVC
	suite.Equal(expectedPVCName, comp.Spec.Volumes[0].PVC)

	suite.Equal(sc, *comp.Spec.Volumes[0].StorageClassName)
	suite.Equal("", comp.Spec.Volumes[0].PVToMatch)
}

func (suite *ComponentTestSuite) TestCreateComponentWithReUsingPVCAsVolume() {
	scName := "kalm-standard"
	pvNameToReuse := "exist-available-pv"

	// prepare Volume & scName
	//sc := storagev1.StorageClassName{
	//	ObjectMeta: v1.ObjectMeta{
	//		Name: scName,
	//	},
	//	Provisioner: "fake-provisioner",
	//}
	//
	//_, err := suite.k8sClinet.StorageV1().StorageClasses().Create(&sc)
	//suite.Nil(err)

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

	reqComp := resources.Component{
		Name: "foobar-reuse-pv",
		ComponentSpec: v1alpha1.ComponentSpec{
			Image: "foo",
			Volumes: []v1alpha1.Volume{
				{
					Path:             "/data",
					Size:             resource.MustParse("1Mi"),
					Type:             v1alpha1.VolumeTypePersistentVolumeClaim,
					StorageClassName: &scName,
					PVToMatch:        pvNameToReuse,
				},
			},
		},
	}

	compInJSON, err := json.Marshal(reqComp)
	suite.Nil(err)

	apiURL := fmt.Sprintf("/v1alpha1/applications/%s/components", suite.namespace)

	rec := suite.NewRequest(http.MethodPost, apiURL, string(compInJSON))

	var res resources.Component
	rec.BodyAsJSON(&res)

	suite.Equal(201, rec.Code)

	// check if volume in Comp is as expected
	comp, err := suite.getComponent(suite.namespace, reqComp.Name)
	suite.Nil(err)

	expectedPVCName := res.Volumes[0].PVC
	suite.Equal(expectedPVCName, comp.Spec.Volumes[0].PVC)

	suite.Equal(scName, *comp.Spec.Volumes[0].StorageClassName)
	suite.Equal(reqComp.Volumes[0].PVToMatch, comp.Spec.Volumes[0].PVToMatch)
}

func (suite *ComponentTestSuite) TestCreateComponentWithReusePVInvalid() {
	// todo
	// 1. pv try to reuse is not available or not exist
}
