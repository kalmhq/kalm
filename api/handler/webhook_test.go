package handler

import (
	"encoding/json"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
	"testing"
)

type WebhookHandlerTestSuite struct {
	WithControllerTestSuite
	namespace string
}

func (suite *WebhookHandlerTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()
	suite.namespace = "kalm-system"
	suite.ensureNamespaceExist(suite.namespace)
}

func (suite *WebhookHandlerTestSuite) TestWebhookHandler() {
  // create component
	component := v1alpha1.Component{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      "test-webhook",
			Namespace: suite.namespace,
		},
		Spec: v1alpha1.ComponentSpec{
			WorkloadType: "server",
			Image:        "nginx:latest",
		},
	}
	err := suite.Create(&component)
	suite.Nil(err)

	// create deployKey
	deployKey := v1alpha1.DeployKey{
		ObjectMeta: metaV1.ObjectMeta{
			Name: "test-webhook",
		},
		Spec: v1alpha1.DeployKeySpec{
			Resources: []string{"test-token"},
			Scope: v1alpha1.DeployKeyTypeCluster,
		},
	}
	err = suite.Create(&deployKey)
	suite.Nil(err)

	deployWebhookCallParams := DeployWebhookCallParams{
		DeployKey:     "test-webhook",
		Namespace:     suite.namespace,
		ComponentName: "test-webhook",
		ImageTag:      "image-tag",
	}
	req,err:=json.Marshal(&deployWebhookCallParams)
	suite.Nil(err)
	rec := suite.NewRequest(http.MethodPost, "/webhook/components", string(req))
	suite.EqualValues(200, rec.Code)
}

func TestWebhookHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(WebhookHandlerTestSuite))
}
