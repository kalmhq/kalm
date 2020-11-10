package handler

import (
	"fmt"
	"net/http"

	"github.com/kalmhq/kalm/api/resources"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/rand"
)

type VolumeTestSuite struct {
	WithControllerTestSuite
	NS  string
	NS2 string
}

// TODO: fix this
// func TestVolumeTestSuite(t *testing.T) {
// suite.Run(t, new(VolumeTestSuite))
// }

func (suite *VolumeTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()

	suite.NS = "kalm-test-" + rand.String(10)
	suite.ensureNamespaceExist(suite.NS)

	suite.NS2 = "kalm-test-" + rand.String(10)
	suite.ensureNamespaceExist(suite.NS2)
}

func (suite *VolumeTestSuite) TestGetAvailableVolsForDP() {
	//prepare pvc & pv

	// a unbound pv
	//unboundPV := suite.createPV()

	// a free bounded pvc & pv pair
	pvc, pv := suite.createBoundedPVCAndPV(suite.NS)

	// a free bounded pvc & pv pair in diff ns
	pvc2, pv2 := suite.createBoundedPVCAndPV(suite.NS2)

	// inUsed volume in same & diff ns
	inUsePVC, _ := suite.createInUseBoundedPVCAndPV(suite.NS)
	inUsePVC2, _ := suite.createInUseBoundedPVCAndPV(suite.NS2)

	// call API from ns
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method:    http.MethodGet,
		Namespace: suite.NS,
		Path:      fmt.Sprintf("/v1alpha1/volumes/available/simple-workload?currentNamespace=%s", suite.NS),
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec, "viewer", suite.NS)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var resList []resources.Volume
			rec.BodyAsJSON(&resList)

			suite.Equal(200, rec.Code)
			suite.Equal(3, len(resList))

			//suite.True(volExists(resources.Volume{
			//	Name: unboundPV.Name,
			//	PVC:  "",
			//	PV:   unboundPV.Name,
			//}, resList))
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
				Name:    inUsePVC.Name,
				IsInUse: true,
				PVC:     inUsePVC.Name,
				PV:      "",
			}, resList))
		},
	})

	// call API from ns2
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method:    http.MethodGet,
		Namespace: suite.NS2,
		Path:      fmt.Sprintf("/v1alpha1/volumes/available/simple-workload?currentNamespace=%s", suite.NS2),
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec, "viewer", suite.NS2)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var resList []resources.Volume
			rec.BodyAsJSON(&resList)

			suite.Equal(200, rec.Code)
			suite.Equal(3, len(resList))

			//suite.True(volExists(resources.Volume{
			//	Name: unboundPV.Name,
			//	PVC:  "",
			//	PV:   unboundPV.Name,
			//}, resList))
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
				Name:    inUsePVC2.Name,
				IsInUse: true,
				PVC:     inUsePVC2.Name,
				PV:      "",
			}, resList))
		},
	})
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

func randomName() string {
	return rand.String(10)
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

	err := suite.Create(&pod)
	suite.Nil(err)

	return pvc, pv
}

func (suite VolumeTestSuite) createBoundedPVCAndPV(ns string) (coreV1.PersistentVolumeClaim, coreV1.PersistentVolume) {
	pvc, pv := genBoundedPVCAndPV(ns)
	err := suite.Create(&pv)
	suite.Nil(err)
	err = suite.Create(&pvc)
	suite.Nil(err)
	return pvc, pv
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
