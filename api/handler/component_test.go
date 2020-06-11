package handler

import (
	"encoding/json"
	"fmt"
	"github.com/kapp-staging/kapp/api/resources"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
	"testing"
)

type ComponentTestSuite struct {
	WithControllerTestSuite
}

func TestComponentTestSuite(t *testing.T) {
	suite.Run(t, new(ComponentTestSuite))
}

var nsName = "kapp-test"

func (suite *ComponentTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()

	// prepare ns
	suite.k8sClinet.CoreV1().Namespaces().Create(&coreV1.Namespace{
		ObjectMeta: v1.ObjectMeta{
			Name: nsName,
		},
	})

	suite.Eventually(func() bool {
		ns, err := suite.k8sClinet.CoreV1().Namespaces().Get(nsName, v1.GetOptions{})
		return err == nil && ns != nil
	})
}

func (suite *ComponentTestSuite) TeardownSuite() {
	suite.k8sClinet.CoreV1().Namespaces().Delete(nsName, nil)

	suite.Eventually(func() bool {
		_, err := suite.k8sClinet.CoreV1().Namespaces().Get(nsName, v1.GetOptions{})
		return errors.IsNotFound(err)
	})
}

//func (suite *ComponentTestSuite) TestGetEmptyComponentList() {
//	rec := suite.NewRequest(http.MethodGet, "/v1alpha1/applications/testKapp/components", nil)
//
//	var res []resources.Component
//	rec.BodyAsJSON(&res)
//
//	suite.Equal(200, rec.Code)
//}

func (suite *ComponentTestSuite) TestCreateComponentWithPVCAsVolume() {

	sc := "kapp-standard"
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

	apiURL := fmt.Sprintf("/v1alpha1/applications/%s/components", nsName)

	rec := suite.NewRequest(http.MethodPost, apiURL, string(compInJSON))

	var res resources.Component
	rec.BodyAsJSON(&res)

	suite.Equal(201, rec.Code)

	// check if volume in Comp is as expected
	compList, err := suite.getComponentList(nsName)
	suite.Nil(err)
	suite.Equal(1, len(compList.Items))

	comp := compList.Items[0]
	suite.Equal(1, len(comp.Spec.Volumes))

	expectedPVCName := res.Volumes[0].PersistentVolumeClaimName
	suite.Equal(expectedPVCName, comp.Spec.Volumes[0].PersistentVolumeClaimName)

	suite.Equal(sc, comp.Spec.Volumes[0].StorageClassName)
	suite.Equal("", comp.Spec.Volumes[0].PersistentVolumeNamePVCToMatch)
}

func (suite *ComponentTestSuite) TestCreateComponentWithReUsingPVCAsVolume() {
	scName := "kapp-standard"
	pvNameToReuse := "existAvailablePV"

	// prepare PV & scName
	//sc := storagev1.StorageClass{
	//	ObjectMeta: v1.ObjectMeta{
	//		Name: scName,
	//	},
	//	Provisioner: "fake-provisioner",
	//}
	//
	//_, err := suite.k8sClinet.StorageV1().StorageClasses().Create(&sc)
	//suite.Nil(err)

	// prepare pv
	pv := coreV1.PersistentVolume{
		ObjectMeta: v1.ObjectMeta{
			Name: pvNameToReuse,
		},
		Spec: coreV1.PersistentVolumeSpec{
			PersistentVolumeSource: coreV1.PersistentVolumeSource{
			},
		},
	}
	_, err = suite.k8sClinet.CoreV1().PersistentVolumes().Create(&pv)
	suite.Nil(err)

	reqComp := resources.Component{
		Name: "foobar-reuse-pv",
		ComponentSpec: v1alpha1.ComponentSpec{
			Image: "foo",
			Volumes: []v1alpha1.Volume{
				{
					Path:                           "/data",
					Size:                           resource.MustParse("1Mi"),
					Type:                           v1alpha1.VolumeTypePersistentVolumeClaim,
					StorageClassName:               &scName,
					PersistentVolumeNamePVCToMatch: "existAvailablePV",
				},
			},
		},
	}

	compInJSON, err := json.Marshal(reqComp)
	suite.Nil(err)

	apiURL := fmt.Sprintf("/v1alpha1/applications/%s/components", nsName)

	rec := suite.NewRequest(http.MethodPost, apiURL, string(compInJSON))

	var res resources.Component
	rec.BodyAsJSON(&res)

	suite.Equal(201, rec.Code)

	// check if volume in Comp is as expected
	compList, err := suite.getComponentList(nsName)
	suite.Nil(err)
	suite.Equal(1, len(compList.Items))

	comp := compList.Items[0]
	suite.Equal(1, len(comp.Spec.Volumes))

	expectedPVCName := res.Volumes[0].PersistentVolumeClaimName
	suite.Equal(expectedPVCName, comp.Spec.Volumes[0].PersistentVolumeClaimName)

	suite.Equal(scName, *comp.Spec.Volumes[0].StorageClassName)
	suite.Equal(reqComp.Volumes[0].PersistentVolumeNamePVCToMatch, comp.Spec.Volumes[0].PersistentVolumeNamePVCToMatch)

}

func (suite *ComponentTestSuite) TestCreateComponentWithReusePVInvalid() {
	// todo
	// 1. pv try to reuse is not available or not exist
}
