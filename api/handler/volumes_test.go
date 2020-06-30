package handler

import (
	"fmt"
	"github.com/kapp-staging/kapp/api/resources"
	"github.com/stretchr/testify/suite"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/rand"
	"net/http"
	"testing"
)

type VolumeTestSuite struct {
	WithControllerTestSuite
	NS  string
	NS2 string
}

func TestVolumeTestSuite(t *testing.T) {
	suite.Run(t, new(VolumeTestSuite))
}

func (suite *VolumeTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()

	// prepare ns
	ns := coreV1.Namespace{
		ObjectMeta: v1.ObjectMeta{
			Name: "kapp-test-" + rand.String(10),
		},
	}
	suite.k8sClinet.CoreV1().Namespaces().Create(&ns)
	suite.NS = ns.Name

	ns2 := coreV1.Namespace{
		ObjectMeta: v1.ObjectMeta{
			Name: "kapp-test-" + rand.String(10),
		},
	}
	suite.k8sClinet.CoreV1().Namespaces().Create(&ns2)
	suite.NS2 = ns2.Name
}

func (suite *VolumeTestSuite) TearDownTest() {
}

func (suite *VolumeTestSuite) TestGetAvailableVolsForDP() {
	//prepare pvc & pv

	// a unbound pv
	unboundPV := suite.createPV()

	// a free bounded pvc & pv pair
	pvc, pv := suite.createBoundedPVCAndPV(suite.NS)

	// a free bounded pvc & pv pair in diff ns
	pvc2, pv2 := suite.createBoundedPVCAndPV(suite.NS2)

	// inUsed volume in same & diff ns
	inUsePVC, _ := suite.createInUseBoundedPVCAndPV(suite.NS)
	inUsePVC2, _ := suite.createInUseBoundedPVCAndPV(suite.NS2)

	// call API from ns
	urlPath := fmt.Sprintf("/v1alpha1/volumes/available/simple-workload?currentNamespace=%s", suite.NS)
	rec := suite.NewRequest(http.MethodGet, urlPath, nil)

	var resList []resources.Volume
	rec.BodyAsJSON(&resList)

	suite.Equal(200, rec.Code)
	suite.Equal(4, len(resList))

	suite.True(volExists(resources.Volume{
		Name: unboundPV.Name,
		PVC:  "",
		PV:   unboundPV.Name,
	}, resList))
	suite.True(volExists(resources.Volume{
		Name: pvc.Name,
		PVC:  pvc.Name,
		PV:   "",
	}, resList))
	suite.True(volExists(resources.Volume{
		Name: pvc2.Name,
		PVC:  "",
		PV:   pv2.Name,
	}, resList))

	// in-use
	suite.True(volExists(resources.Volume{
		Name: inUsePVC.Name,
		IsInUse: true,
		PVC:  inUsePVC.Name,
		PV:   "",
	}, resList))

	// call API from ns2
	urlPath = fmt.Sprintf("/v1alpha1/volumes/available/simple-workload?currentNamespace=%s", suite.NS2)
	rec = suite.NewRequest(http.MethodGet, urlPath, nil)
	rec.BodyAsJSON(&resList)

	suite.Equal(200, rec.Code)
	suite.Equal(4, len(resList))

	suite.True(volExists(resources.Volume{
		Name: unboundPV.Name,
		PVC:  "",
		PV:   unboundPV.Name,
	}, resList))
	suite.True(volExists(resources.Volume{
		Name: pvc.Name,
		PVC:  "",
		PV:   pv.Name,
	}, resList))
	suite.True(volExists(resources.Volume{
		Name: pvc2.Name,
		PVC:  pvc2.Name,
		PV:   "",
	}, resList))
	// in-use
	suite.True(volExists(resources.Volume{
		Name: inUsePVC2.Name,
		IsInUse: true,
		PVC:  inUsePVC2.Name,
		PV:   "",
	}, resList))
}

func volExists(vol resources.Volume, list []resources.Volume) bool {
	for _, one := range list {
		if one.Name == vol.Name &&
			one.PVC == vol.PVC &&
			one.PV == vol.PV &&
			one.IsInUse == vol.IsInUse {
			return true
		}
	}

	return false
}

func volNotExists(vol resources.Volume, list []resources.Volume) bool {
	for _, one := range list {
		if one.Name == vol.Name &&
			one.PVC == vol.PVC &&
			one.PV == vol.PV {
			return false
		}
	}

	return true
}

//todo
//func (suite *VolumeTestSuite) TestGetAvailableVolsForSTS() {
//}

func randomName() string {
	return rand.String(10)
}

func (suite *VolumeTestSuite) createPV() coreV1.PersistentVolume {
	unboundPV := genPV()
	rst, err := suite.k8sClinet.CoreV1().PersistentVolumes().Create(&unboundPV)

	suite.Nil(err)

	return *rst
}

func genPV() coreV1.PersistentVolume {
	pv := coreV1.PersistentVolume{
		ObjectMeta: v1.ObjectMeta{
			Name: "pv-" + randomName(),
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
	return pv
}

func genPVC(ns string) coreV1.PersistentVolumeClaim {
	sc := "fake-storage-class"

	return coreV1.PersistentVolumeClaim{
		ObjectMeta: v1.ObjectMeta{
			Namespace: ns,
			Name:      "pvc-" + randomName(),
		},
		Spec: coreV1.PersistentVolumeClaimSpec{
			StorageClassName: &sc,
			AccessModes:      []coreV1.PersistentVolumeAccessMode{coreV1.ReadWriteOnce},
			Resources: coreV1.ResourceRequirements{
				Requests: map[coreV1.ResourceName]resource.Quantity{
					coreV1.ResourceStorage: resource.MustParse("1Mi"),
				},
			},
		},
	}
}

func (suite VolumeTestSuite) createInUseBoundedPVCAndPV(ns string) (coreV1.PersistentVolumeClaim, coreV1.PersistentVolume) {
	pvc, pv := suite.createBoundedPVCAndPV(ns)

	pod := coreV1.Pod{
		ObjectMeta: v1.ObjectMeta{
			Name:      "pod-" + randomName(),
			Namespace: ns,
		},
		Spec: coreV1.PodSpec{
			Containers: []coreV1.Container{
				{
					Name:  "container-name",
					Image: "alpine",
					//Env:   []coreV1.EnvVar{},
					//Resources: coreV1.ResourceRequirements{
					//	Requests: make(map[coreV1.ResourceName]resource.Quantity),
					//	Limits:   make(map[coreV1.ResourceName]resource.Quantity),
					//},
				},
			},
			Volumes: []coreV1.Volume{
				{
					Name: "vol-fake",
					VolumeSource: coreV1.VolumeSource{
						PersistentVolumeClaim: &coreV1.PersistentVolumeClaimVolumeSource{
							ClaimName: pvc.Name,
						},
					},
				},
			},
		},
	}

	_, err := suite.k8sClinet.CoreV1().Pods(pod.Namespace).Create(&pod)
	suite.Nil(err)

	return pvc, pv
}

func (suite VolumeTestSuite) createBoundedPVCAndPV(ns string) (coreV1.PersistentVolumeClaim, coreV1.PersistentVolume) {
	pvc, pv := genBoundedPVCAndPV(ns)
	rstPV, err := suite.k8sClinet.CoreV1().PersistentVolumes().Create(&pv)
	suite.Nil(err)
	rstPVC, err := suite.k8sClinet.CoreV1().PersistentVolumeClaims(pvc.Namespace).Create(&pvc)
	suite.Nil(err)

	return *rstPVC, *rstPV
}

func genBoundedPVCAndPV(ns string) (coreV1.PersistentVolumeClaim, coreV1.PersistentVolume) {
	pvc := genPVC(ns)
	pv := genPV()

	pv.Spec.ClaimRef = &coreV1.ObjectReference{
		APIVersion: "v1",
		Kind:       "PersistentVolumeClaim",
		Name:       pvc.Name,
		Namespace:  pvc.Namespace,
	}

	return pvc, pv
}
