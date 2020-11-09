package handler

import (
	"net/http"
	"testing"

	"github.com/kalmhq/kalm/api/resources"
	"github.com/stretchr/testify/suite"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type NodesHandlerTestSuite struct {
	WithControllerTestSuite
}

func (suite *NodesHandlerTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()
	suite.ensureNamespaceExist("test-nodes")
}

func (suite *NodesHandlerTestSuite) TestNodesHandler() {
	// create a node
	node := v1.Node{
		ObjectMeta: metav1.ObjectMeta{
			Name: "test-node",
		},
		Spec: v1.NodeSpec{
			PodCIDR:    "10.56.2.0/24",
			PodCIDRs:   []string{"10.56.2.0/24"},
			ProviderID: "test-node-provider-id",
		},
	}
	err := suite.Create(&node)
	suite.Nil(err)

	// list node
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterViewerRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/nodes",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var nodeList resources.NodesResponse
			rec.BodyAsJSON(&nodeList)
			suite.EqualValues(200, rec.Code)
			suite.Equal(1, len(nodeList.Nodes))
			suite.Equal("test-node", nodeList.Nodes[0].Name)
		},
	})

	// uncordon node
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodPost,
		Path:   "/v1alpha1/nodes/test-node/uncordon",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.EqualValues(200, rec.Code)
		},
	})

	// cordon node
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodPost,
		Path:   "/v1alpha1/nodes/test-node/cordon",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsUnauthorizedError(rec)
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.EqualValues(200, rec.Code)
		},
	})
}

func TestNodesHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(NodesHandlerTestSuite))
}
