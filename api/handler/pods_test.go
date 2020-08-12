package handler

import (
	"fmt"
	"github.com/stretchr/testify/suite"
	coreV1 "k8s.io/api/core/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
	"testing"
)

type PodsHandlerTestSuite struct {
	WithControllerTestSuite
}

func (suite *PodsHandlerTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()
	suite.ensureNamespaceExist("test-pods")
}

func (suite *PodsHandlerTestSuite) TestPodsHandler() {
	// create a pod
	pod := coreV1.Pod{
		ObjectMeta: v1.ObjectMeta{
			Name:      "test-pods-1",
			Namespace: "test-pods",
		},
		Spec: coreV1.PodSpec{
			Containers: []coreV1.Container{
				{
					Name:  "test-pod-1-1",
					Image: "image",
				},
			},
		},
	}

	err := suite.Create(&pod)
	suite.Nil(err)

	// delete pod
	rec := suite.NewRequest(http.MethodDelete,
		fmt.Sprintf("/v1alpha1/pods/%s/%s", "test-pods", "test-pods-1"),
		nil,
	)
	suite.Equal(200, rec.Code)
}

func TestPodsHandlerTestSuite (t *testing.T){
	suite.Run(t, new(PodsHandlerTestSuite))
}
