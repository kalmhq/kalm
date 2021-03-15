package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"

	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
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
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetViewerRoleOfNamespace(suite.namespace),
		},
		Namespace: suite.namespace,
		Method:    http.MethodGet,
		Path:      fmt.Sprintf("/v1alpha1/applications/%s/components", suite.namespace),
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(200, rec.Code)
		},
	})
}

func (suite *ComponentTestSuite) TestBasicRequestOfComponents() {
	// Create
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetEditorRoleOfNamespace(suite.namespace),
		},
		Namespace: suite.namespace,
		Method:    http.MethodPost,
		Path:      fmt.Sprintf("/v1alpha1/applications/%s/components", suite.namespace),
		Body: resources.Component{
			Name: "foobar",
			ComponentSpec: &v1alpha1.ComponentSpec{
				Image: "foo",
			},
		},
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var res resources.Component
			rec.BodyAsJSON(&res)
			suite.Equal(201, rec.Code)
			suite.Equal("foo", res.Image)
		},
	})

	// Get
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetEditorRoleOfNamespace(suite.namespace),
		},
		Namespace: suite.namespace,
		Method:    http.MethodGet,
		Path:      fmt.Sprintf("/v1alpha1/applications/%s/components/%s", suite.namespace, "foobar"),
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var res resources.Component
			rec.BodyAsJSON(&res)
			suite.Equal(200, rec.Code)
			suite.Equal("foo", res.Image)
		},
	})

	// Update
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetEditorRoleOfNamespace(suite.namespace),
		},
		Namespace: suite.namespace,
		Method:    http.MethodPut,
		Path:      fmt.Sprintf("/v1alpha1/applications/%s/components/%s", suite.namespace, "foobar"),
		Body: resources.Component{
			Name: "foobar",
			ComponentSpec: &v1alpha1.ComponentSpec{
				Image: "foo2",
			},
		},
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var res resources.Component
			rec.BodyAsJSON(&res)
			suite.Equal(200, rec.Code)
			suite.Equal("foo2", res.Image)
		},
	})

	// Delete
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetEditorRoleOfNamespace(suite.namespace),
		},
		Namespace: suite.namespace,
		Method:    http.MethodDelete,
		Path:      fmt.Sprintf("/v1alpha1/applications/%s/components/%s", suite.namespace, "foobar"),
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(204, rec.Code)
		},
	})

	// Get Again
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetEditorRoleOfNamespace(suite.namespace),
		},
		Namespace: suite.namespace,
		Method:    http.MethodGet,
		Path:      fmt.Sprintf("/v1alpha1/applications/%s/components/%s", suite.namespace, "foobar"),
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(404, rec.Code)
		},
	})
}

func (suite *ComponentTestSuite) TestCreateComponentWithPVCAsVolume() {
	sc := "kalm-standard"
	reqComp := resources.Component{
		Name: "foobar-create-new-pv",
		ComponentSpec: &v1alpha1.ComponentSpec{
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

	// create component
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetEditorRoleOfNamespace(suite.namespace),
		},
		Namespace: suite.namespace,
		Method:    http.MethodPost,
		Path:      fmt.Sprintf("/v1alpha1/applications/%s/components", suite.namespace),
		Body:      reqComp,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var res resources.Component
			rec.BodyAsJSON(&res)
			suite.Equal(201, rec.Code)
		},
	})

	// Get List
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetViewerRoleOfNamespace(suite.namespace),
		},
		Namespace: suite.namespace,
		Method:    http.MethodGet,
		Path:      fmt.Sprintf("/v1alpha1/applications/%s/components", suite.namespace),
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var res []resources.ComponentDetails
			rec.BodyAsJSON(&res)
			suite.Equal(200, rec.Code)

			suite.Len(res, 1)
			suite.Len(res[0].Volumes, 1)

			suite.Equal(sc, *res[0].Volumes[0].StorageClassName)
			suite.Equal("", res[0].Volumes[0].PVToMatch)
		},
	})
}

func (suite *ComponentTestSuite) TestCreateComponentWithReUsingPVCAsVolume() {
	scName := "kalm-standard"
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

	reqComp := resources.Component{
		Name: "foobar-reuse-pv",
		ComponentSpec: &v1alpha1.ComponentSpec{
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

	// create component
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetEditorRoleOfNamespace(suite.namespace),
		},
		Namespace: suite.namespace,
		Method:    http.MethodPost,
		Path:      fmt.Sprintf("/v1alpha1/applications/%s/components", suite.namespace),
		Body:      reqComp,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
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
		},
	})
}

//func (suite *ComponentTestSuite) TestCreateComponentWithReusePVInvalid() {
// todo
// 1. pv try to reuse is not available or not exist
//}

func (suite *ComponentTestSuite) TestCreateComponentWithResourceRequirements() {
	component := resources.Component{
		Name: "component-with-resource-requirements",
		ComponentSpec: &v1alpha1.ComponentSpec{
			Image: "foo",
			ResourceRequirements: &coreV1.ResourceRequirements{
				Limits: map[coreV1.ResourceName]resource.Quantity{
					coreV1.ResourceCPU:    resource.MustParse("100m"),
					coreV1.ResourceMemory: resource.MustParse("0.1Gi"),
				},
				Requests: map[coreV1.ResourceName]resource.Quantity{
					coreV1.ResourceCPU:    resource.MustParse("10"),
					coreV1.ResourceMemory: resource.MustParse("10Mi"),
				},
			},
		},
	}

	// create component
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetEditorRoleOfNamespace(suite.namespace),
		},
		Namespace: suite.namespace,
		Method:    http.MethodPost,
		Path:      fmt.Sprintf("/v1alpha1/applications/%s/components", suite.namespace),
		Body:      component,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(201, rec.Code)

			recBytes := rec.bytes
			respMap := make(map[string]interface{})
			//fmt.Println("recBytes:", string(recBytes))
			err := json.Unmarshal(recBytes, &respMap)
			suite.Nil(err)

			suite.Equal("100m", respMap["cpuLimit"])
			suite.Equal("107374183", respMap["memoryLimit"])
			suite.Equal("10000m", respMap["cpuRequest"])
			suite.Equal("10485760", respMap["memoryRequest"])
		},
	})
}
