package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"github.com/kalmhq/kalm/api/client"
	"github.com/kalmhq/kalm/api/config"
	"github.com/kalmhq/kalm/api/server"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/suite"
	"io"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/scheme"
	"net/http/httptest"
	"path/filepath"
	"sigs.k8s.io/controller-runtime/pkg/envtest"
	"strings"
	"time"
)

type WithControllerTestSuite struct {
	suite.Suite
	testEnv   *envtest.Environment
	k8sClinet *kubernetes.Clientset
	apiServer *echo.Echo
}

type ResponseRecorder struct {
	*httptest.ResponseRecorder
	bytes []byte
}

func (r *ResponseRecorder) read() {
	r.bytes = r.Body.Bytes()
}

func (r *ResponseRecorder) BodyAsString() string {
	return string(r.bytes)
}

func (r *ResponseRecorder) BodyAsJSON(obj interface{}) {
	//fmt.Println("body:", string(r.bytes))

	_ = json.Unmarshal(r.bytes, obj)
}

func (suite *WithControllerTestSuite) SetupSuite() {
	suite.testEnv = &envtest.Environment{
		CRDDirectoryPaths: []string{filepath.Join("..", "..", "controller", "config", "crd", "bases")},
	}

	cfg, err := suite.testEnv.Start()

	if err != nil {
		panic(err)
	}

	// TODO the test server has no permissions

	k8sClient, err := kubernetes.NewForConfig(cfg)

	if err != nil {
		panic(err)
	}

	suite.k8sClinet = k8sClient

	runningConfig := &config.Config{
		KubernetesApiServerAddress: cfg.Host,
	}

	suite.Nil(scheme.AddToScheme(scheme.Scheme))
	suite.Nil(v1alpha1.AddToScheme(scheme.Scheme))

	e := server.NewEchoServer(runningConfig)
	clientManager := client.NewClientManager(runningConfig)
	apiHandler := NewApiHandler(clientManager)
	apiHandler.Install(e)

	suite.apiServer = e
}

func (suite *WithControllerTestSuite) TearDownSuite() {
	suite.testEnv.Stop()
}

func (suite *WithControllerTestSuite) Eventually(condition func() bool, msgAndArgs ...interface{}) bool {
	waitFor := time.Second * 20
	tick := time.Millisecond * 500
	return suite.Suite.Eventually(condition, waitFor, tick, msgAndArgs...)
}

func (suite *WithControllerTestSuite) NewRequest(method string, path string, body interface{}) *ResponseRecorder {
	return suite.NewRequestWithHeaders(method, path, body, map[string]string{
		echo.HeaderAuthorization: "Bearer faketoken", // TODO use a real token
	})
}

func (suite *WithControllerTestSuite) NewRequestWithHeaders(method string, path string, body interface{}, headers map[string]string) *ResponseRecorder {
	var reader io.Reader

	switch v := body.(type) {
	case nil:
		reader = bytes.NewReader([]byte{})
	case string:
		reader = strings.NewReader(v)
	default:
		reader = toReader(body)
	}

	req := httptest.NewRequest(method, path, reader)

	if headers != nil {
		for k, v := range headers {
			req.Header.Add(k, v)
		}
	}
	req.Header.Add(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := &ResponseRecorder{
		ResponseRecorder: httptest.NewRecorder(),
	}
	suite.apiServer.ServeHTTP(rec, req)
	rec.read()
	return rec
}

func toReader(obj interface{}) io.Reader {
	bts, _ := json.Marshal(obj)
	return bytes.NewBuffer(bts)
}

func (suite *WithControllerTestSuite) getPVCList(ns string) (*v1.PersistentVolumeClaimList, error) {
	pvsList, err := suite.k8sClinet.CoreV1().PersistentVolumeClaims(ns).List(context.Background(), metav1.ListOptions{})
	return pvsList, err
}

func (suite *WithControllerTestSuite) getComponentList(ns string) (v1alpha1.ComponentList, error) {
	compListAPIURL := fmt.Sprintf("/apis/core.kalm.dev/v1alpha1/namespaces/%s/components", ns)

	var compList v1alpha1.ComponentList
	err := suite.k8sClinet.RESTClient().Get().AbsPath(compListAPIURL).Do(context.Background()).Into(&compList)

	return compList, err
}

func (suite *WithControllerTestSuite) getComponent(ns, compName string) (v1alpha1.Component, error) {
	compAPIURL := fmt.Sprintf("/apis/core.kalm.dev/v1alpha1/namespaces/%s/components/%s", ns, compName)

	var comp v1alpha1.Component
	err := suite.k8sClinet.RESTClient().Get().AbsPath(compAPIURL).Do(context.Background()).Into(&comp)

	return comp, err
}

func (suite *WithControllerTestSuite) ensureNamespaceExist(ns string) {
	nsKey := metav1.ObjectMeta{Name: ns}

	_, err := suite.k8sClinet.CoreV1().Namespaces().Get(
		context.Background(),
		nsKey.Name,
		metav1.GetOptions{},
	)

	if errors.IsNotFound(err) {
		_, err = suite.k8sClinet.CoreV1().Namespaces().Create(
			context.Background(),
			&v1.Namespace{ObjectMeta: nsKey},
			metav1.CreateOptions{},
		)

		suite.Nil(err)
	}
}
